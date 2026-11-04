import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { apiErrors } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

const send = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(await screen.findByLabelText("Email"), "amine@autosouk.ma");
  await user.click(screen.getByRole("button", { name: "Send reset link" }));
};

describe("ForgotPasswordPage", () => {
  it("shows the API's confirmation", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/api/auth/forgot-password", () =>
        HttpResponse.json({
          code: "auth.password_reset_email_sent",
          message: "Reset email sent",
        }),
      ),
    );
    renderApp("/forgot-password");

    await send(user);

    expect(await screen.findByRole("status")).toHaveTextContent("Reset email sent");
  });

  it("shows the API's error", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/api/auth/forgot-password", () =>
        apiErrors(404, { code: "auth.email_not_found", message: "No account found" }),
      ),
    );
    renderApp("/forgot-password");

    await send(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("No account found");
  });
});
