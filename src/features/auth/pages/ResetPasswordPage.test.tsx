import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { apiErrors } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

const submit = async (
  user: ReturnType<typeof userEvent.setup>,
  password: string,
  confirmation: string,
) => {
  await user.type(await screen.findByLabelText("New password"), password);
  await user.type(screen.getByLabelText("Confirm password"), confirmation);
  await user.click(screen.getByRole("button", { name: "Update password" }));
};

describe("ResetPasswordPage", () => {
  it("updates the password and returns to log in with the API's message", async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.put("*/api/auth/forgot-password", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          code: "auth.password_updated",
          message: "Password updated",
        });
      }),
    );
    const router = renderApp("/reset-password?token=abc");

    await submit(user, "Str0ng!pass", "Str0ng!pass");

    expect(await screen.findByText("Password updated")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(body).toEqual({ token: "abc", password: "Str0ng!pass" });
  });

  it("stops when the passwords differ, without calling the API", async () => {
    const user = userEvent.setup();
    let called = false;
    server.use(
      http.put("*/api/auth/forgot-password", () => {
        called = true;
        return HttpResponse.json({ code: "ok", message: "ok" });
      }),
    );
    renderApp("/reset-password?token=abc");

    await submit(user, "Str0ng!pass", "different");

    expect(await screen.findByText("Passwords don't match")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toHaveFocus();
    expect(called).toBe(false);
  });

  it("shows the API's password error next to the input", async () => {
    const user = userEvent.setup();
    server.use(
      http.put("*/api/auth/forgot-password", () =>
        apiErrors(400, {
          code: "validation.password_strength",
          message: "Password is too weak",
          field: "password",
        }),
      ),
    );
    renderApp("/reset-password?token=abc");

    await submit(user, "weak", "weak");

    expect(await screen.findByText("Password is too weak")).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toHaveAccessibleDescription(
      "Password is too weak",
    );
  });

  it("offers a new link when the token is missing", async () => {
    renderApp("/reset-password");

    expect(
      await screen.findByRole("heading", { name: "This link isn't valid" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request a new link" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });
});
