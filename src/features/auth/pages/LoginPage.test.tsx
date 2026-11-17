import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { apiErrors, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

const logIn = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(await screen.findByLabelText("Email"), "amine@autosouk.ma");
  await user.type(screen.getByLabelText("Password"), "Str0ng!pass");
  await user.click(screen.getByRole("button", { name: "Log in" }));
};

describe("LoginPage", () => {
  it("logs in and goes to the home page", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/api/auth/login", () =>
        HttpResponse.json({ accessToken: "token", user: testUser }),
      ),
    );
    const router = renderApp("/login");

    await logIn(user);

    expect(
      await screen.findByText("Salam, Amine"),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  it("sends a new account to check its phone first", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/api/auth/login", () =>
        HttpResponse.json({
          accessToken: "token",
          user: { ...testUser, phoneVerified: false, identityStatus: "not_submitted" },
        }),
      ),
      http.post("*/api/auth/phone/code", () =>
        HttpResponse.json({ phone: testUser.phone, expiresAt: new Date().toISOString(), resendAt: new Date().toISOString() }),
      ),
    );
    const router = renderApp("/login");

    await logIn(user);

    expect(await screen.findByRole("heading", { name: "Check your phone" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/verify-phone");
  });

  it("asks for the texted code on a new device", async () => {
    const user = userEvent.setup();
    const codes: unknown[] = [];
    server.use(
      http.post("*/api/auth/login", () =>
        HttpResponse.json({
          twoFactorRequired: true,
          challengeToken: "c".repeat(64),
          phoneHint: "•• 78",
          expiresAt: new Date(Date.now() + 600_000).toISOString(),
        }),
      ),
      http.post("*/api/auth/login/two-factor", async ({ request }) => {
        const body = (await request.json()) as { code: string };
        codes.push(body);
        return body.code === "482619"
          ? HttpResponse.json({ accessToken: "token", user: testUser })
          : apiErrors(400, { code: "auth.phone_code_invalid", message: "That code is wrong. Tries left: 2" });
      }),
    );
    const router = renderApp("/login");

    await logIn(user);
    expect(await screen.findByRole("heading", { name: "Check your phone" })).toBeInTheDocument();
    expect(screen.getByText(/the phone ending/u)).toHaveTextContent("•• 78");
    const code = screen.getByRole("group", { name: "Sign-in code" });

    await user.type(within(code).getByRole("textbox", { name: "Digit 1 of 6" }), "000000");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("That code is wrong. Tries left: 2")).toBeInTheDocument();

    await user.type(within(code).getByRole("textbox", { name: "Digit 1 of 6" }), "482619");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Salam, Amine")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
    expect(codes).toEqual([
      { challengeToken: "c".repeat(64), code: "000000" },
      { challengeToken: "c".repeat(64), code: "482619" },
    ]);
  });

  it("goes back to the password when the sign-in expired", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/api/auth/login", () =>
        HttpResponse.json({
          twoFactorRequired: true,
          challengeToken: "c".repeat(64),
          phoneHint: "•• 78",
          expiresAt: new Date().toISOString(),
        }),
      ),
      http.post("*/api/auth/login/two-factor", () =>
        apiErrors(400, { code: "auth.two_factor_expired", message: "This sign-in code expired or was used up. Log in again" }),
      ),
    );
    renderApp("/login");

    await logIn(user);
    await user.type(await screen.findByRole("textbox", { name: "Digit 1 of 6" }), "123456");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("This sign-in code expired");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Back to log in" }));
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });

  it("shows the API's message when the credentials are wrong", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/api/auth/login", () =>
        apiErrors(401, {
          code: "auth.invalid_credentials",
          message: "Email or password is not correct",
        }),
      ),
    );
    renderApp("/login");

    await logIn(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email or password is not correct",
    );
  });

  it("tells a suspended user why they can't sign in", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/api/auth/login", () =>
        apiErrors(403, {
          code: "auth.account_suspended",
          message: "Your account is suspended. Contact AutoSouk support to find out more.",
        }),
      ),
    );
    const router = renderApp("/login");

    await logIn(user);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Account suspended");
    expect(alert).toHaveTextContent("Your account is suspended. Contact AutoSouk support to find out more.");
    expect(router.state.location.pathname).toBe("/login");
  });

  it("attaches a field error to its input and moves focus there", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/api/auth/login", () =>
        apiErrors(400, {
          code: "validation.invalid_email",
          message: "Must be a valid email",
          field: "email",
        }),
      ),
    );
    renderApp("/login");

    await logIn(user);

    const email = screen.getByLabelText("Email");
    expect(await screen.findByText("Must be a valid email")).toBeInTheDocument();
    expect(email).toHaveAccessibleDescription("Must be a valid email");
    expect(email).toHaveFocus();
  });

  it("resends the verification link to the typed email", async () => {
    const user = userEvent.setup();
    let sentTo: unknown;
    server.use(
      http.post("*/api/auth/re-verify", async ({ request }) => {
        sentTo = await request.json();
        return HttpResponse.json({ code: "ok", message: "Sent" });
      }),
    );
    const router = renderApp("/login");

    await user.type(await screen.findByLabelText("Email"), "amine@autosouk.ma");
    await user.click(screen.getByRole("button", { name: "Resend" }));

    expect(
      await screen.findByRole("heading", { name: "Check your inbox" }),
    ).toBeInTheDocument();
    expect(sentTo).toEqual({ email: "amine@autosouk.ma" });
    expect(router.state.location.pathname).toBe("/check-email");
  });

  it("links to the other auth pages", async () => {
    const user = userEvent.setup();
    const router = renderApp("/login");

    await user.click(await screen.findByRole("link", { name: "Forgot password?" }));
    expect(router.state.location.pathname).toBe("/forgot-password");

    await user.click(await screen.findByRole("link", { name: "Back to log in" }));
    expect(router.state.location.pathname).toBe("/login");

    await user.click(await screen.findByRole("link", { name: "Create account" }));
    expect(router.state.location.pathname).toBe("/register");
  });

  it("sends a signed-in visitor to the home page", async () => {
    server.use(
      http.post("*/api/auth/refresh-token", () =>
        HttpResponse.json({ accessToken: "token", user: testUser }),
      ),
    );
    const router = renderApp("/login");

    expect(
      await screen.findByText("Salam, Amine"),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  it("refreshes the session only once on load", async () => {
    let refreshes = 0;
    server.use(
      http.post("*/api/auth/refresh-token", () => {
        refreshes += 1;
        return HttpResponse.json({ accessToken: "token", user: testUser });
      }),
    );
    renderApp("/");

    await screen.findByText("Salam, Amine");

    expect(refreshes).toBe(1);
  });
});
