import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "../../../test/bootstrap";
import { apiErrors, storageResponse, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

type Status = "not_submitted" | "pending" | "rejected";

// Stands in for the browser's recorder: it hands over one chunk when stopped.
class FakeRecorder extends EventTarget {
  static isTypeSupported = (type: string) => type.startsWith("video/webm");
  state: "inactive" | "recording" = "inactive";
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    const dataEvent = Object.assign(new Event("dataavailable"), { data: new Blob(["video"], { type: "video/webm" }) });
    this.dispatchEvent(dataEvent);
    this.dispatchEvent(new Event("stop"));
  }
}

const stopTrack = vi.fn();
const getUserMedia = vi.fn();

beforeEach(() => {
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  getUserMedia.mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] });
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// A signed-in user with a verified phone. Records what the page sends.
const identityApi = (status: Status = "not_submitted", extra: { attemptsLeft?: number; reason?: string } = {}) => {
  const started: unknown[] = [];
  const submitted: number[] = [];
  let current: Status | "pending" = status;
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, identityStatus: status } }),
    ),
    http.get("*/api/identity/me", () =>
      HttpResponse.json({
        phoneVerified: true,
        identityStatus: current,
        attemptsLeft: extra.attemptsLeft ?? 3,
        rejectionReason: extra.reason ?? null,
      }),
    ),
    http.post("*/api/identity/verifications", async ({ request }) => {
      started.push(await request.json());
      return HttpResponse.json(
        {
          verification: {
            id: 12,
            challenges: ["look_straight", "turn_left", "look_up", "smile"],
            expiresAt: new Date(Date.now() + 600_000).toISOString(),
          },
          upload: { url: "http://storage.test/identity", fields: { key: "identity-1-abc.webm", "Content-Type": "video/" } },
          attemptsLeft: 3,
        },
        { status: 201 },
      );
    }),
    http.post("http://storage.test/identity", () => storageResponse(204)),
    http.post("*/api/identity/verifications/12/submit", () => {
      submitted.push(12);
      current = "pending";
      return HttpResponse.json({ identityStatus: "pending" });
    }),
  );
  return { started, submitted };
};

describe("IdentityCheckPage", () => {
  it("records the challenges, then sends the video for review", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { started, submitted } = identityApi();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp("/verify-identity");

    await user.click(await screen.findByRole("checkbox", { name: /I agree that AutoSouk records my face video/u }));
    await user.click(screen.getByRole("button", { name: "Start the camera" }));

    expect(await screen.findByRole("heading", { name: "Follow the instructions" })).toBeInTheDocument();
    expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: "user" }, audio: false });
    expect(started).toEqual([{ contentType: "video/webm" }]);
    const steps = screen.getByRole("list", { name: "Instructions" });
    expect(steps).toHaveTextContent("1Look straight at the camera (now)");
    expect(screen.getByText("Challenge 1 of 4")).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(screen.getByText("Challenge 2 of 4")).toBeInTheDocument();
    expect(steps).toHaveTextContent("Look straight at the camera (done)");

    await act(() => vi.advanceTimersByTimeAsync(9000));
    expect(await screen.findByRole("heading", { name: "Check your video" })).toBeInTheDocument();
    expect(stopTrack).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Send for review" }));
    expect(await screen.findByRole("heading", { name: "We're checking your video" })).toBeInTheDocument();
    expect(submitted).toEqual([12]);
  });

  it("lets a mechanic send their documents while the video waits", async () => {
    identityApi("pending");
    server.use(
      http.post("*/api/auth/refresh-token", () =>
        HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "mechanic", identityStatus: "pending" } }),
      ),
    );
    renderApp("/verify-identity");

    expect(await screen.findByRole("heading", { name: "We're checking your video" })).toBeInTheDocument();
    expect(
      screen.getByText("Send your documents now: an admin checks them with your video, so buyers can book you sooner."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Send my documents" })).toHaveAttribute("href", "/mechanic/documents");
    expect(screen.queryByRole("link", { name: "Browse cars" })).not.toBeInTheDocument();
  });

  it("asks for the consent first", async () => {
    identityApi();
    const user = userEvent.setup();
    renderApp("/verify-identity");

    await user.click(await screen.findByRole("button", { name: "Start the camera" }));

    expect(screen.getByRole("checkbox", { name: /I agree/u })).toHaveAccessibleDescription(
      "Tick the box to agree first.",
    );
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("says when the camera is blocked", async () => {
    identityApi();
    getUserMedia.mockRejectedValue(new DOMException("denied", "NotAllowedError"));
    const user = userEvent.setup();
    renderApp("/verify-identity");

    await user.click(await screen.findByRole("checkbox", { name: /I agree/u }));
    await user.click(screen.getByRole("button", { name: "Start the camera" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("We can't use your camera.");
  });

  it("shows the API's message when the check can't start", async () => {
    identityApi();
    server.use(
      http.post("*/api/identity/verifications", () =>
        apiErrors(403, { code: "identity.too_many_attempts", message: "You have used all your attempts. Contact support" }),
      ),
    );
    const user = userEvent.setup();
    renderApp("/verify-identity");

    await user.click(await screen.findByRole("checkbox", { name: /I agree/u }));
    await user.click(screen.getByRole("button", { name: "Start the camera" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("You have used all your attempts.");
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("tells a rejected user why, and lets them record again", async () => {
    identityApi("rejected", { attemptsLeft: 2, reason: "Your face was hidden during step 3" });
    const user = userEvent.setup();
    renderApp("/verify-identity");

    expect(await screen.findByRole("heading", { name: "We couldn't verify you" })).toBeInTheDocument();
    expect(screen.getByText("Your face was hidden during step 3")).toBeInTheDocument();
    expect(screen.getByText("2 attempts left")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Record again" }));
    expect(screen.getByRole("heading", { name: "Show us it's really you" })).toBeInTheDocument();
  });

  it("offers no new attempt once they're used up", async () => {
    identityApi("rejected", { attemptsLeft: 0, reason: "Not the same person" });
    renderApp("/verify-identity");

    expect(await screen.findByText(/You have used all your attempts/u)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Record again" })).not.toBeInTheDocument();
  });

  it("sends a user without a verified phone to the phone step", async () => {
    server.use(
      http.post("*/api/auth/refresh-token", () =>
        HttpResponse.json({ accessToken: "token", user: { ...testUser, phoneVerified: false } }),
      ),
      http.get("*/api/identity/me", () =>
        HttpResponse.json({ phoneVerified: false, identityStatus: "not_submitted", attemptsLeft: 3, rejectionReason: null }),
      ),
      http.post("*/api/auth/phone/code", () =>
        HttpResponse.json({ phone: testUser.phone, expiresAt: new Date().toISOString(), resendAt: new Date().toISOString() }),
      ),
    );
    const router = renderApp("/verify-identity");

    expect(await screen.findByRole("heading", { name: "Check your phone" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/verify-phone");
  });
});
