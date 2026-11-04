import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderApp } from "../../../test/renderApp";

const entry = (email: string) => ({
  pathname: "/check-email",
  state: { email },
});

describe("CheckEmailPage", () => {
  it("shows the address, and waits before allowing a resend", async () => {
    renderApp(entry("amine@autosouk.ma"));

    expect(await screen.findByText("amine@autosouk.ma")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resend in/ })).toBeDisabled();
  });

  it("opens Gmail for a Gmail address", async () => {
    renderApp(entry("amine@gmail.com"));

    expect(await screen.findByRole("link", { name: "Open Gmail" })).toHaveAttribute(
      "href",
      "https://mail.google.com",
    );
  });

  it("opens the mail app for another address", async () => {
    renderApp(entry("amine@autosouk.ma"));

    expect(await screen.findByRole("link", { name: "Open mail app" })).toHaveAttribute(
      "href",
      "mailto:",
    );
  });

  it("offers a way back when the address is wrong", async () => {
    renderApp(entry("amine@autosouk.ma"));

    expect(await screen.findByRole("link", { name: "Sign up again" })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("goes to log in when opened without an address", async () => {
    const router = renderApp("/check-email");

    await screen.findByRole("heading", { name: "Welcome back" });
    expect(router.state.location.pathname).toBe("/login");
  });
});
