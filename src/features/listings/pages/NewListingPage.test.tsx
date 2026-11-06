import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { apiErrors, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

const signInAs = (role: string) => {
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role } }),
    ),
  );
};

describe("NewListingPage", () => {
  it("opens from my listings and shows the first step as current", async () => {
    const user = userEvent.setup();
    signInAs("seller");
    const router = renderApp("/my-listings");

    await user.click((await screen.findAllByRole("link", { name: "New listing" }))[0]!);

    expect(router.state.location.pathname).toBe("/my-listings/new");
    const current = (await screen.findByText("Car details")).closest("ol")?.querySelector('[aria-current="step"]');
    expect(current).toHaveTextContent("Listing");
  });

  it("creates the draft and moves on to the car step", async () => {
    const user = userEvent.setup();
    signInAs("seller");
    let sent: unknown;
    server.use(
      http.post("*/api/listings", async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ listing: { id: 7 } }, { status: 201 });
      }),
      http.get("*/api/listings/7", () =>
        HttpResponse.json({
          listing: { id: 7, title: "Golf 8", description: "Clean car", status: "draft", car: null },
        }),
      ),
    );
    const router = renderApp("/my-listings/new");

    await user.type(await screen.findByLabelText("Title"), "Golf 8");
    await user.type(screen.getByLabelText("Description"), "Clean car");
    await user.click(screen.getByRole("button", { name: "Continue to car details" }));

    expect(await screen.findByRole("heading", { name: "Car details", level: 1 })).toBeInTheDocument();
    expect(sent).toEqual({ title: "Golf 8", description: "Clean car" });
    expect(router.state.location.pathname).toBe("/my-listings/7/car");
  });

  it("shows the API's errors next to their inputs and focuses the first", async () => {
    const user = userEvent.setup();
    signInAs("seller");
    server.use(
      http.post("*/api/listings", () =>
        apiErrors(
          400,
          { code: "validation.required", message: "Title is required", field: "title" },
          { code: "validation.required", message: "Description is required", field: "description" },
        ),
      ),
    );
    const router = renderApp("/my-listings/new");

    await user.click(await screen.findByRole("button", { name: "Continue to car details" }));

    const title = await screen.findByLabelText("Title");
    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(title).toHaveAccessibleDescription("Title is required");
    expect(screen.getByLabelText("Description")).toHaveAccessibleDescription("Description is required");
    expect(title).toHaveFocus();
    expect(router.state.location.pathname).toBe("/my-listings/new");
  });

  it("shows an error that belongs to no input in the summary", async () => {
    const user = userEvent.setup();
    signInAs("seller");
    server.use(
      http.post("*/api/listings", () =>
        apiErrors(500, { code: "unexpected", message: "The server had a problem" }),
      ),
    );
    renderApp("/my-listings/new");

    await user.click(await screen.findByRole("button", { name: "Continue to car details" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The server had a problem");
  });

  it("leaves without saving when the seller discards", async () => {
    const user = userEvent.setup();
    signInAs("seller");
    let created = false;
    server.use(
      http.post("*/api/listings", () => {
        created = true;
        return HttpResponse.json({ listing: { id: 7 } }, { status: 201 });
      }),
    );
    const router = renderApp("/my-listings/new");

    await user.type(await screen.findByLabelText("Title"), "Golf 8");
    await user.click(screen.getByRole("link", { name: "Discard" }));

    expect(router.state.location.pathname).toBe("/my-listings");
    expect(created).toBe(false);
  });

  it("is not available to a buyer", async () => {
    signInAs("buyer");
    renderApp("/my-listings/new");

    expect(await screen.findByRole("heading", { name: "You can't open this page" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
  });
});
