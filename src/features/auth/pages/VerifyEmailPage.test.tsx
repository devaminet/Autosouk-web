import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { apiErrors } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

describe("VerifyEmailPage", () => {
  it("confirms the account and links to log in", async () => {
    renderApp("/verify-email?status=success&code=auth.account_verified&lang=en");

    expect(
      await screen.findByRole("heading", { name: "Your account has been verified" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Browse cars" })).toHaveAttribute("href", "/");
  });

  it("treats an already verified account as verified", async () => {
    renderApp("/verify-email?status=error&code=auth.already_verified&lang=en");

    expect(
      await screen.findByRole("heading", { name: "Your account has been verified" }),
    ).toBeInTheDocument();
  });

  it("offers a new link when the link expired", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/api/auth/re-verify", () =>
        HttpResponse.json({ code: "ok", message: "Sent" }),
      ),
    );
    const router = renderApp("/verify-email?status=error&code=auth.link_expired&lang=en");

    await user.type(await screen.findByLabelText("Email"), "amine@autosouk.ma");
    await user.click(screen.getByRole("button", { name: "Send a new link" }));

    await screen.findByRole("heading", { name: "Check your inbox" });
    expect(router.state.location.pathname).toBe("/check-email");
  });

  it("shows the API's error when a new link cannot be sent", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/api/auth/re-verify", () =>
        apiErrors(404, { code: "auth.email_not_found", message: "No account found" }),
      ),
    );
    renderApp("/verify-email?status=error&code=auth.token_invalid&lang=en");

    await user.type(await screen.findByLabelText("Email"), "nobody@autosouk.ma");
    await user.click(screen.getByRole("button", { name: "Send a new link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No account found");
  });

  it("translates another error code with the API's catalog", async () => {
    renderApp("/verify-email?status=error&code=unexpected&lang=en");

    expect(await screen.findByText("An unexpected error occurred")).toBeInTheDocument();
  });

  it("goes to log in without a status", async () => {
    const router = renderApp("/verify-email");

    await screen.findByRole("heading", { name: "Welcome back" });
    expect(router.state.location.pathname).toBe("/login");
  });
});
