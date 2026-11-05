import { screen, within } from "@testing-library/react";
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

  it("saves the draft and returns to my listings with a notice", async () => {
    const user = userEvent.setup();
    signInAs("seller");
    let sent: unknown;
    let saved = false;
    server.use(
      http.post("*/api/listings", async ({ request }) => {
        sent = await request.json();
        saved = true;
        return HttpResponse.json({ listing: { id: 7 } }, { status: 201 });
      }),
      http.get("*/api/listings/mine", () =>
        HttpResponse.json({
          listings: saved
            ? [
                {
                  id: 7,
                  title: "Golf 8",
                  status: "draft",
                  rejectionReason: null,
                  updatedAt: "2026-11-05",
                  completedInspectionsCount: 0,
                  car: null,
                },
              ]
            : [],
          meta: {
            total: saved ? 1 : 0,
            page: 1,
            limit: 10,
            totalPages: saved ? 1 : 0,
            statusCounts: {
              draft: saved ? 1 : 0,
              pending: 0,
              approved: 0,
              withdrawn: 0,
              rejected: 0,
              sold: 0,
            },
          },
        }),
      ),
    );
    const router = renderApp("/my-listings/new");

    await user.type(await screen.findByLabelText("Title"), "Golf 8");
    await user.type(screen.getByLabelText("Description"), "Clean car");
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    // The list is still loading here, and its loading text is a status too.
    const notice = (await screen.findByText("Your draft is saved.")).closest("output");
    expect(notice).toHaveFocus();
    expect(sent).toEqual({ title: "Golf 8", description: "Clean car" });
    expect(router.state.location.pathname).toBe("/my-listings");
    expect(await within(await screen.findByRole("table")).findByText("Golf 8")).toBeInTheDocument();
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

    await user.click(await screen.findByRole("button", { name: "Save draft" }));

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

    await user.click(await screen.findByRole("button", { name: "Save draft" }));

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
