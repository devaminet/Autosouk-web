import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { apiErrors, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

const newUser = { ...testUser, phoneVerified: false, identityStatus: "not_submitted" };

// A signed-in user whose phone isn't verified. Records the codes typed.
const phoneApi = ({ send = "ok" as "ok" | "wait", verifyError = false } = {}) => {
  const codes: unknown[] = [];
  let sent = 0;
  server.use(
    http.post("*/api/auth/refresh-token", () => HttpResponse.json({ accessToken: "token", user: newUser })),
    http.post("*/api/auth/phone/code", () => {
      sent += 1;
      if (send === "wait") {
        return HttpResponse.json(
          { errors: [{ code: "auth.phone_code_wait", message: "Wait 42 seconds", params: { seconds: 42 } }] },
          { status: 429 },
        );
      }
      const now = Date.now();
      return HttpResponse.json({
        phone: newUser.phone,
        expiresAt: new Date(now + 600_000).toISOString(),
        resendAt: new Date(now + 60_000).toISOString(),
      });
    }),
    http.post("*/api/auth/phone/verify", async ({ request }) => {
      codes.push(await request.json());
      return verifyError
        ? apiErrors(400, { code: "auth.phone_code_invalid", message: "That code is wrong. Tries left: 2" })
        : HttpResponse.json({ user: { ...newUser, phoneVerified: true } });
    }),
    http.get("*/api/identity/me", () =>
      HttpResponse.json({ phoneVerified: true, identityStatus: "not_submitted", attemptsLeft: 3, rejectionReason: null }),
    ),
  );
  return { codes, sentCount: () => sent };
};

describe("VerifyPhonePage", () => {
  it("texts a code on opening and checks the one typed", async () => {
    const { codes, sentCount } = phoneApi();
    const user = userEvent.setup();
    const router = renderApp("/verify-phone");

    const code = await screen.findByRole("group", { name: "Code sent to ⁨+212 6 •• •• 56 78⁩" });
    expect(await screen.findByText(/^Resend in/u)).toBeInTheDocument();
    expect(sentCount()).toBe(1);
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm).toBeDisabled();

    await user.type(within(code).getByRole("textbox", { name: "Digit 1 of 6" }), "482619");
    expect(within(code).getByRole("textbox", { name: "Digit 6 of 6" })).toHaveValue("9");
    await user.click(confirm);

    expect(await screen.findByRole("heading", { name: "Show us it's really you" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/verify-identity");
    expect(codes).toEqual([{ code: "482619" }]);
  });

  it("fills every box from a pasted code", async () => {
    phoneApi();
    const user = userEvent.setup();
    renderApp("/verify-phone");

    await user.click(await screen.findByRole("textbox", { name: "Digit 1 of 6" }));
    await user.paste("48 26 19");

    expect(screen.getByRole("textbox", { name: "Digit 4 of 6" })).toHaveValue("6");
    expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();
  });

  it("shows the API's message under the boxes", async () => {
    phoneApi({ verifyError: true });
    const user = userEvent.setup();
    renderApp("/verify-phone");

    await user.type(await screen.findByRole("textbox", { name: "Digit 1 of 6" }), "000000");
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(await screen.findByRole("group", { name: /^Code sent to/u })).toHaveAccessibleDescription(
      "That code is wrong. Tries left: 2",
    );
  });

  it("counts down when a code was sent a moment ago", async () => {
    phoneApi({ send: "wait" });
    renderApp("/verify-phone");

    expect(await screen.findByText("0:42")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeEmptyDOMElement();
  });

  it("moves on when the phone is already verified", async () => {
    server.use(
      http.post("*/api/auth/refresh-token", () =>
        HttpResponse.json({ accessToken: "token", user: { ...newUser, phoneVerified: true } }),
      ),
      http.get("*/api/identity/me", () =>
        HttpResponse.json({ phoneVerified: true, identityStatus: "pending", attemptsLeft: 3, rejectionReason: null }),
      ),
    );
    const router = renderApp("/verify-phone");

    expect(await screen.findByRole("heading", { name: "We're checking your video" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/verify-identity");
  });
});
