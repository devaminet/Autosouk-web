import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { apiErrors } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";
import i18n from "../../../lib/i18n";

const fillForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(await screen.findByLabelText("First name"), "Amine");
  await user.type(screen.getByLabelText("Last name"), "Takha");
  await user.type(screen.getByLabelText("Email"), "amine@autosouk.ma");
  await user.type(screen.getByLabelText("Phone"), "+212612345678");
  await user.selectOptions(
    screen.getByLabelText("City"),
    await screen.findByRole("option", { name: "Casablanca" }),
  );
  await user.type(screen.getByLabelText("Password"), "Str0ng!pass");
};

const submit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Create account" }));

describe("RegisterPage", () => {
  it("creates the account and asks to check the inbox", async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.post("*/api/auth/register", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          { code: "auth.account_created", message: "Created" },
          { status: 201 },
        );
      }),
    );
    const router = renderApp("/register");

    await fillForm(user);
    await user.click(screen.getByRole("radio", { name: /Seller/ }));
    await submit(user);

    expect(
      await screen.findByRole("heading", { name: "Check your inbox" }),
    ).toBeInTheDocument();
    expect(screen.getByText("amine@autosouk.ma")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/check-email");
    expect(body).toEqual({
      firstName: "Amine",
      lastName: "Takha",
      email: "amine@autosouk.ma",
      phone: "+212612345678",
      password: "Str0ng!pass",
      userType: "seller",
      cityId: 1,
    });
  });

  it("shows each API error next to its input", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/api/auth/register", () =>
        apiErrors(
          400,
          { code: "validation.string_min", message: "Too short", field: "firstName" },
          { code: "validation.invalid_phone", message: "Bad phone", field: "phone" },
        ),
      ),
    );
    renderApp("/register");

    await fillForm(user);
    await submit(user);

    expect(await screen.findByText("Too short")).toBeInTheDocument();
    expect(screen.getByLabelText("First name")).toHaveAccessibleDescription("Too short");
    expect(screen.getByLabelText("Phone")).toHaveAccessibleDescription("Bad phone");
    expect(screen.getByLabelText("First name")).toHaveFocus();
  });

  it("shows an error without a field in the summary", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/api/auth/register", () =>
        apiErrors(400, { code: "auth.email_in_use", message: "Email in use" }),
      ),
    );
    renderApp("/register");

    await fillForm(user);
    await submit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("Email in use");
  });

  it("uploads the photo with the upload policy from the API", async () => {
    const user = userEvent.setup();
    let imageName: unknown;
    let uploaded = false;
    server.use(
      http.post("*/api/auth/register", async ({ request }) => {
        const body: unknown = await request.json();
        imageName = body && typeof body === "object" && "imageName" in body ? body.imageName : undefined;
        return HttpResponse.json(
          {
            code: "auth.account_created",
            message: "Created",
            imageUpload: { url: "http://storage.test/users", fields: { key: "profile.png" } },
          },
          { status: 201 },
        );
      }),
      http.post("http://storage.test/users", () => {
        uploaded = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderApp("/register");

    await fillForm(user);
    await user.upload(
      screen.getByLabelText("Profile photo"),
      new File(["photo"], "me.png", { type: "image/png" }),
    );
    await submit(user);

    await screen.findByRole("heading", { name: "Check your inbox" });
    expect(imageName).toBe("me.png");
    expect(uploaded).toBe(true);
  });

  it("still continues when the photo upload fails, and says so", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/api/auth/register", () =>
        HttpResponse.json(
          {
            code: "auth.account_created",
            message: "Created",
            imageUpload: { url: "http://storage.test/users", fields: {} },
          },
          { status: 201 },
        ),
      ),
      http.post("http://storage.test/users", () => new HttpResponse(null, { status: 403 })),
    );
    renderApp("/register");

    await fillForm(user);
    await user.upload(
      screen.getByLabelText("Profile photo"),
      new File(["photo"], "me.png", { type: "image/png" }),
    );
    await submit(user);

    expect(
      await screen.findByText("Your account is ready, but we couldn't upload your photo."),
    ).toBeInTheDocument();
  });

  it("shows live password feedback", async () => {
    const user = userEvent.setup();
    renderApp("/register");

    await user.type(await screen.findByLabelText("Password"), "Ab1");

    expect(screen.getByText(/Upper and lower case/)).toHaveTextContent("(met)");
    expect(screen.getByText(/8\+ characters/)).toHaveTextContent("(not met yet)");
  });

  it("explains when the cities cannot be loaded", async () => {
    server.use(http.get("*/api/lookups", () => apiErrors(500, { code: "internal", message: "Boom" })));
    renderApp("/register");

    expect(
      await screen.findByText("We couldn't load the cities. Reload the page to try again.", undefined, { timeout: 4000 }),
    ).toBeInTheDocument();
  });

  it("switches the interface to Arabic, right to left", async () => {
    const user = userEvent.setup();
    renderApp("/register");

    await user.click(await screen.findByRole("radio", { name: "العربية" }));

    expect(await screen.findByRole("heading", { name: "إنشاء حسابك" })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
    expect(document.documentElement).toHaveAttribute("lang", "ar");
    expect(i18n.language).toBe("ar");
  });
});
