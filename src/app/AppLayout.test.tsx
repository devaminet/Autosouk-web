import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../test/bootstrap";
import { testUser } from "../test/handlers";
import { renderApp } from "../test/renderApp";

const seller = { ...testUser, role: "seller" };

const signInAs = (user: typeof testUser) => {
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user }),
    ),
  );
};

describe("seller access", () => {
  it("shows a seller the seller page and its navigation", async () => {
    signInAs(seller);
    renderApp("/my-listings");

    expect(
      await screen.findByRole("heading", { name: "My listings" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sell a car" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "My listings" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("sends a guest to log in, then back to the seller page", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/api/auth/login", () =>
        HttpResponse.json({ accessToken: "token", user: seller }),
      ),
    );
    const router = renderApp("/my-listings");

    await user.type(await screen.findByLabelText("Email"), "amine@autosouk.ma");
    expect(router.state.location.pathname).toBe("/login");
    await user.type(screen.getByLabelText("Password"), "Str0ng!pass");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByRole("heading", { name: "My listings" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/my-listings");
  });

  it("tells a buyer the page is not available and hides seller links", async () => {
    signInAs(testUser);
    renderApp("/my-listings");

    expect(
      await screen.findByRole("heading", { name: "You can't open this page" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.queryByRole("link", { name: "Sell a car" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "My listings" })).not.toBeInTheDocument();
  });
});

describe("user menu", () => {
  it("logs out from the avatar menu", async () => {
    const user = userEvent.setup();
    signInAs(testUser);
    server.use(
      http.post("*/api/auth/logout", () =>
        HttpResponse.json({ code: "auth.logged_out", message: "Logged out" }),
      ),
    );
    renderApp("/");

    await user.click(await screen.findByRole("button", { name: "Account" }));
    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("link", { name: "Log in" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Account" })).not.toBeInTheDocument();
  });

  it("stays signed in and shows an error when log out fails", async () => {
    const user = userEvent.setup();
    signInAs(testUser);
    server.use(
      http.post("*/api/auth/logout", () =>
        HttpResponse.json(
          { errors: [{ code: "unexpected", message: "Server error" }] },
          { status: 500 },
        ),
      ),
    );
    renderApp("/");

    await user.click(await screen.findByRole("button", { name: "Account" }));
    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
    expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    signInAs(testUser);
    renderApp("/");

    await user.click(await screen.findByRole("button", { name: "Account" }));
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
  });
});
