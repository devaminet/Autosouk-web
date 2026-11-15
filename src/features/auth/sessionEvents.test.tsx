import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { queryClient } from "../../lib/queryClient";
import { server } from "../../test/bootstrap";
import { openStreams } from "../../test/eventSource";
import { apiErrors, testUser } from "../../test/handlers";
import { renderApp } from "../../test/renderApp";

const signIn = () => {
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: testUser }),
    ),
  );
};

// The stream the signed-in tab opens.
const stream = async () => {
  await vi.waitFor(() => expect(openStreams()).toHaveLength(1));
  const [source] = openStreams();
  if (!source) {
    throw new Error("No stream open");
  }
  return source;
};

const expectSignedOut = async () => {
  expect(await screen.findByText("You were signed out. Log in again to continue.")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  expect(queryClient.getQueryData(["session"])).toBeNull();
  expect(openStreams()).toHaveLength(0);
};

describe("session events", () => {
  it("opens no stream for a visitor", async () => {
    renderApp("/");

    expect(await screen.findByRole("link", { name: "Log in" })).toBeInTheDocument();
    expect(openStreams()).toHaveLength(0);
  });

  it("signs out at once when another device ends the session", async () => {
    signIn();
    const router = renderApp("/account");
    await screen.findByRole("region", { name: "Personal information" });
    const source = await stream();
    expect(source.url).toBe("/api/auth/events");
    // The signed-in user's data, which must not stay behind.
    queryClient.setQueryData(["devices"], [{ id: 1 }]);

    act(() => source.emit("session.revoked"));

    await expectSignedOut();
    expect(router.state.location.pathname).toBe("/login");
    expect(queryClient.getQueryData(["devices"])).toBeUndefined();
  });

  it("signs out when another tab of the browser hears the session ended", async () => {
    signIn();
    const router = renderApp("/");
    await stream();
    const otherTab = new BroadcastChannel("autosouk.session");

    otherTab.postMessage("session.ended");

    await expectSignedOut();
    expect(router.state.location.pathname).toBe("/login");
    otherTab.close();
  });

  it("asks the API when the stream is refused, and signs out if the session is gone", async () => {
    signIn();
    const router = renderApp("/account");
    const source = await stream();
    server.use(
      http.post("*/api/auth/refresh-token", () =>
        apiErrors(401, { code: "not_authorized", message: "Not authorized" }),
      ),
    );

    act(() => source.refuse());

    await expectSignedOut();
    // Logging in again leads back to the page.
    expect(router.state.location.state).toMatchObject({ from: "/account" });
  });

  it("stays signed in when the stream is refused but the session lives", async () => {
    signIn();
    let refreshes = 0;
    server.use(
      http.post("*/api/auth/refresh-token", () => {
        refreshes += 1;
        return HttpResponse.json({ accessToken: "token", user: testUser });
      }),
    );
    renderApp("/account");
    const source = await stream();

    act(() => source.refuse());

    await vi.waitFor(() => expect(refreshes).toBe(2));
    expect(screen.getByRole("region", { name: "Personal information" })).toBeInTheDocument();
    expect(queryClient.getQueryData(["session"])).toMatchObject({ id: testUser.id });
  });

  it("reloads the signed-in devices when another device logs out", async () => {
    signIn();
    let laptopSignedIn = true;
    server.use(
      http.get("*/api/auth/devices", () =>
        HttpResponse.json({
          devices: [
            { id: 1, label: "Safari on iOS", ipAddress: null, createdAt: "2026-11-01T10:00:00.000Z", lastSeenAt: new Date().toISOString(), current: true },
            ...(laptopSignedIn
              ? [{ id: 2, label: "Chrome on Windows", ipAddress: null, createdAt: "2026-11-02T10:00:00.000Z", lastSeenAt: "2026-11-10T10:00:00.000Z", current: false }]
              : []),
          ],
        }),
      ),
    );
    renderApp("/account");
    const section = within(await screen.findByRole("region", { name: "Sign-in security" }));
    expect(await section.findByText("Chrome on Windows")).toBeInTheDocument();
    const source = await stream();

    laptopSignedIn = false;
    act(() => source.emit("devices.changed"));

    await waitFor(() => expect(section.queryByText("Chrome on Windows")).not.toBeInTheDocument());
    expect(section.getByText("Safari on iOS")).toBeInTheDocument();
  });

  it("leaves this tab's own logout where it is", async () => {
    signIn();
    const user = userEvent.setup();
    let source: Awaited<ReturnType<typeof stream>> | undefined;
    server.use(
      http.post("*/api/auth/logout", async () => {
        // The API tells the device's tabs before it answers.
        act(() => source?.emit("session.revoked"));
        await delay(10);
        return HttpResponse.json({ code: "auth.logged_out", message: "Logged out" });
      }),
    );
    const router = renderApp("/");
    source = await stream();

    await user.click(await screen.findByRole("button", { name: "Account" }));
    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("link", { name: "Log in" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
    expect(screen.queryByText("You were signed out. Log in again to continue.")).not.toBeInTheDocument();
  });

  it("leaves this tab's own logout where it is when the event comes after the answer", async () => {
    signIn();
    const user = userEvent.setup();
    let source: Awaited<ReturnType<typeof stream>> | undefined;
    server.use(
      http.post("*/api/auth/logout", () => {
        // The event travels on another connection and may arrive later.
        setTimeout(() => act(() => source?.emit("session.revoked")), 0);
        return HttpResponse.json({ code: "auth.logged_out", message: "Logged out" });
      }),
    );
    const router = renderApp("/");
    source = await stream();

    await user.click(await screen.findByRole("button", { name: "Account" }));
    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("link", { name: "Log in" })).toBeInTheDocument();
    await act(() => delay(20));
    expect(router.state.location.pathname).toBe("/");
    expect(screen.queryByText("You were signed out. Log in again to continue.")).not.toBeInTheDocument();
  });

  it("logs out when the answer is lost but the API ended the session", async () => {
    signIn();
    const user = userEvent.setup();
    server.use(http.post("*/api/auth/logout", () => HttpResponse.error()));
    renderApp("/");
    await stream();
    server.use(
      http.post("*/api/auth/refresh-token", () =>
        apiErrors(401, { code: "not_authorized", message: "Not authorized" }),
      ),
    );

    await user.click(await screen.findByRole("button", { name: "Account" }));
    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("link", { name: "Log in" })).toBeInTheDocument();
    expect(queryClient.getQueryData(["session"])).toBeNull();
  });

  it("stays signed in and says so when the logout really failed", async () => {
    signIn();
    const user = userEvent.setup();
    server.use(http.post("*/api/auth/logout", () => HttpResponse.error()));
    renderApp("/");
    await stream();

    await user.click(await screen.findByRole("button", { name: "Account" }));
    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(queryClient.getQueryData(["session"])).toMatchObject({ id: testUser.id });
  });

  it("shows the sign-out notice only until the user goes elsewhere", async () => {
    signIn();
    const router = renderApp("/");
    const source = await stream();
    act(() => source.emit("session.revoked"));
    await expectSignedOut();

    await act(() => router.navigate("/register"));
    await act(() => router.navigate("/login"));

    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.queryByText("You were signed out. Log in again to continue.")).not.toBeInTheDocument();
  });
});
