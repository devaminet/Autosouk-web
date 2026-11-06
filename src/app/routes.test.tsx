import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderApp } from "../test/renderApp";

describe("routes", () => {
  it("lets a guest reach log in and sign up from the home page", async () => {
    const user = userEvent.setup();
    const router = renderApp("/");

    await user.click(await screen.findByRole("link", { name: "Log in" }));
    await screen.findByRole("heading", { name: "Welcome back" });
    expect(router.state.location.pathname).toBe("/login");

    await router.navigate("/");
    await screen.findByRole("heading", { name: "Find a car you can trust." });
    await user.click(screen.getByRole("link", { name: "Create account" }));
    await screen.findByRole("heading", { name: "Create your account" });
    expect(router.state.location.pathname).toBe("/register");
  });

  it("moves focus to the new page's main region after navigation", async () => {
    const user = userEvent.setup();
    renderApp("/");

    await user.click(await screen.findByRole("link", { name: "Log in" }));
    await screen.findByRole("heading", { name: "Welcome back" });

    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("shows a page for an unknown address", async () => {
    renderApp("/nope");

    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
  });

  it("gives each page a title", async () => {
    renderApp("/login");

    await screen.findByRole("heading", { name: "Welcome back" });

    expect(document.title).toBe("Log in · AutoSouk");
  });
});
