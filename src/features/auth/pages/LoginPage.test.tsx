import { screen } from "@testing-library/react";
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
      await screen.findByRole("heading", { name: "Welcome, Amine" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
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
      await screen.findByRole("heading", { name: "Welcome, Amine" }),
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

    await screen.findByRole("heading", { name: "Welcome, Amine" });

    expect(refreshes).toBe(1);
  });
});
