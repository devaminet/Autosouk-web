import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { apiErrors, storageResponse, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

const signIn = (changes: Partial<typeof testUser> = {}) => {
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, ...changes } }),
    ),
  );
};

const passwordForm = async () =>
  within(await screen.findByRole("region", { name: "Change password" }));

describe("AccountPage", () => {
  it("sends someone who isn't signed in to log in", async () => {
    const router = renderApp("/account");

    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
  });

  it("shows the signed-in user's details", async () => {
    // Emails keep the language saved at signup, whatever the page is in.
    signIn({ locale: "fr" });
    renderApp("/account");

    const personal = within(await screen.findByRole("region", { name: "Personal information" }));
    expect(personal.getByText("amine@autosouk.ma")).toBeInTheDocument();
    expect(personal.getByText("+212612345678")).toBeInTheDocument();
    expect(await personal.findByText("Casablanca")).toBeInTheDocument();
    const language = within(screen.getByRole("region", { name: "Language" }));
    expect(language.getByText(/Emails and inspection reports/u)).toHaveTextContent("Français");
  });

  it("marks the section chosen in the side menu", async () => {
    signIn();
    const user = userEvent.setup();
    renderApp("/account");
    // jsdom has no layout, so only clicks can pick a section here.
    const menu = within(await screen.findByRole("navigation", { name: "Settings sections" }));

    await user.click(menu.getByRole("link", { name: "Security" }));

    expect(menu.getByRole("link", { name: "Security" })).toHaveAttribute("aria-current", "location");
    expect(menu.getAllByRole("link", { current: "location" })).toHaveLength(1);
  });

  it("changes the password and shows the API's message", async () => {
    signIn();
    const user = userEvent.setup();
    let body: unknown;
    let authorization: string | null = null;
    server.use(
      http.put("*/api/auth/reset-password", async ({ request }) => {
        body = await request.json();
        authorization = request.headers.get("Authorization");
        return HttpResponse.json({ code: "auth.password_updated", message: "Password updated" });
      }),
    );
    renderApp("/account");
    const form = await passwordForm();

    await user.type(form.getByLabelText("Current password"), "Old!pass1");
    await user.type(form.getByLabelText("New password"), "Str0ng!pass");
    await user.type(form.getByLabelText("Confirm password"), "Str0ng!pass");
    await user.click(form.getByRole("button", { name: "Update password" }));

    expect(await form.findByText("Password updated")).toBeInTheDocument();
    expect(body).toEqual({
      email: "amine@autosouk.ma",
      oldPassword: "Old!pass1",
      password: "Str0ng!pass",
      confirmPassword: "Str0ng!pass",
    });
    expect(authorization).toBe("Bearer token");
    expect(form.getByLabelText("Current password")).toHaveValue("");
    expect(form.getByLabelText("New password")).toHaveValue("");
  });

  it("stops when the new passwords differ, without calling the API", async () => {
    signIn();
    const user = userEvent.setup();
    let called = false;
    server.use(
      http.put("*/api/auth/reset-password", () => {
        called = true;
        return HttpResponse.json({ code: "ok", message: "ok" });
      }),
    );
    renderApp("/account");
    const form = await passwordForm();

    await user.type(form.getByLabelText("Current password"), "Old!pass1");
    await user.type(form.getByLabelText("New password"), "Str0ng!pass");
    await user.type(form.getByLabelText("Confirm password"), "different");
    await user.click(form.getByRole("button", { name: "Update password" }));

    expect(await form.findByText("Passwords don't match")).toBeInTheDocument();
    expect(form.getByLabelText("Confirm password")).toHaveFocus();
    expect(called).toBe(false);
  });

  it("shows a wrong current password as the API words it", async () => {
    signIn();
    const user = userEvent.setup();
    server.use(
      http.put("*/api/auth/reset-password", () =>
        apiErrors(400, { code: "auth.invalid_password", message: "Wrong password" }),
      ),
    );
    renderApp("/account");
    const form = await passwordForm();

    await user.type(form.getByLabelText("Current password"), "Old!pass1");
    await user.type(form.getByLabelText("New password"), "Str0ng!pass");
    await user.type(form.getByLabelText("Confirm password"), "Str0ng!pass");
    await user.click(form.getByRole("button", { name: "Update password" }));

    expect(await form.findByText("Wrong password")).toBeInTheDocument();
  });

  it("emails a reset link to the signed-in user", async () => {
    signIn();
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.post("*/api/auth/forgot-password", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ code: "auth.password_reset_email_sent", message: "Check your inbox" });
      }),
    );
    renderApp("/account");
    const form = await passwordForm();

    await user.click(form.getByRole("button", { name: "Reset it by email" }));

    expect(await form.findByText("Check your inbox")).toBeInTheDocument();
    expect(body).toEqual({ email: "amine@autosouk.ma" });
  });

  it("uploads a new photo, confirms it and shows it", async () => {
    signIn();
    const user = userEvent.setup();
    let imageName: unknown;
    server.use(
      http.post("*/api/auth/profile-image", async ({ request }) => {
        imageName = ((await request.json()) as { imageName?: unknown }).imageName;
        return HttpResponse.json({
          imageUpload: { url: "http://storage.test/profiles", fields: { key: "profiles/new.png" } },
        });
      }),
      http.post("http://storage.test/profiles", () => storageResponse(204)),
      http.post("*/api/auth/profile-image/confirm", () =>
        HttpResponse.json({ imageUrl: "http://storage.test/profiles/new.png" }),
      ),
    );
    renderApp("/account");

    await user.upload(
      await screen.findByLabelText("Change photo"),
      new File(["photo"], "me.png", { type: "image/png" }),
    );

    expect(await screen.findByRole("img", { name: "Your profile photo" })).toHaveAttribute(
      "src",
      "http://storage.test/profiles/new.png",
    );
    expect(imageName).toBe("me.png");
  });

  it("says so when the photo doesn't reach storage", async () => {
    signIn();
    const user = userEvent.setup();
    server.use(
      http.post("*/api/auth/profile-image", () =>
        HttpResponse.json({ imageUpload: { url: "http://storage.test/profiles", fields: {} } }),
      ),
      http.post("http://storage.test/profiles", () => storageResponse(403)),
    );
    renderApp("/account");

    await user.upload(
      await screen.findByLabelText("Change photo"),
      new File(["photo"], "me.png", { type: "image/png" }),
    );

    expect(
      await screen.findByText("We couldn't upload your photo. Please try again."),
    ).toBeInTheDocument();
  });

  it("stops an upload on request", async () => {
    signIn();
    const user = userEvent.setup();
    let confirmed = false;
    server.use(
      http.post("*/api/auth/profile-image", () =>
        HttpResponse.json({ imageUpload: { url: "http://storage.test/profiles", fields: {} } }),
      ),
      http.post("http://storage.test/profiles", async () => {
        await delay("infinite");
        return storageResponse(204);
      }),
      http.post("*/api/auth/profile-image/confirm", () => {
        confirmed = true;
        return HttpResponse.json({ imageUrl: "http://storage.test/profiles/new.png" });
      }),
    );
    renderApp("/account");

    await user.upload(
      await screen.findByLabelText("Change photo"),
      new File(["photo"], "me.png", { type: "image/png" }),
    );
    await user.click(await screen.findByRole("button", { name: "Stop the upload" }));

    expect(screen.queryByText("me.png")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change photo" })).toBeEnabled();
    expect(screen.queryByText("We couldn't upload your photo. Please try again.")).not.toBeInTheDocument();
    expect(confirmed).toBe(false);
  });

  it("logs out", async () => {
    signIn();
    const user = userEvent.setup();
    server.use(
      http.post("*/api/auth/logout", () =>
        HttpResponse.json({ code: "auth.logged_out", message: "Logged out" }),
      ),
    );
    const router = renderApp("/account");

    const section = within(await screen.findByRole("region", { name: "Log out of this device" }));
    await user.click(section.getByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
  });

  it("links mechanics to their workshop", async () => {
    signIn({ role: "mechanic" });
    const user = userEvent.setup();
    const router = renderApp("/account");

    const workshop = within(await screen.findByRole("region", { name: "Your workshop" }));
    const sections = within(screen.getByRole("navigation", { name: "Settings sections" }));
    expect(sections.getByRole("link", { name: "Workshop" })).toHaveAttribute("href", "/account#workshop");
    await user.click(workshop.getByRole("link", { name: "Open my workshop" }));

    expect(router.state.location.pathname).toBe("/workshop");
  });

  it("has no workshop section for other roles", async () => {
    signIn();
    renderApp("/account");

    expect(await screen.findByRole("region", { name: "Personal information" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Your workshop" })).not.toBeInTheDocument();
  });
});

