import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { testCar } from "../../../test/fixtures";
import { apiErrors, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

const row = {
  id: 7,
  title: "My Golf",
  description: "Clean car",
  status: "approved",
  approvedAt: "2026-11-01",
  rejectionReason: null,
  createdAt: "2026-10-01",
  updatedAt: "2026-10-03",
  completedInspectionsCount: 0,
  car: { id: 70, price: 265000, year: 2020, distance: "54000", carMedias: [] },
};

const statusCounts = { draft: 0, pending: 0, approved: 1, withdrawn: 0, rejected: 1, sold: 1 };

const renderList = (listings: unknown[], entry = "/my-listings") => {
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "seller" } }),
    ),
    http.get("*/api/listings/mine", () =>
      HttpResponse.json({
        listings,
        meta: { total: listings.length, page: 1, limit: 10, totalPages: 1, statusCounts },
      }),
    ),
    http.get("*/api/listings/7", () =>
      HttpResponse.json({
        listing: { id: 7, title: "My Golf", description: "Clean car", status: "approved", car: testCar },
      }),
    ),
  );
  return renderApp(entry);
};

const openDrawer = async (user: ReturnType<typeof userEvent.setup>) => {
  const table = await screen.findByRole("table");
  await user.click(within(table).getByRole("link", { name: "Edit My Golf" }));
  const dialog = await screen.findByRole("dialog", { name: "My Golf" });
  await within(dialog).findByLabelText("Price");
  return dialog;
};

describe("EditListingDrawer", () => {
  it("sends only the changed fields and shows the listing is back in review", async () => {
    const user = userEvent.setup();
    let sent: unknown;
    server.use(
      http.patch("*/api/listings/7", async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ listing: { id: 7 } });
      }),
    );
    const router = renderList([row]);

    const dialog = await openDrawer(user);
    expect(router.state.location.search).toBe("?edit=7");
    expect(within(dialog).getByText(/hides it from search/u)).toBeInTheDocument();

    const price = within(dialog).getByLabelText("Price");
    await user.clear(price);
    await user.type(price, "259 000");
    await user.selectOptions(within(dialog).getByLabelText("Condition"), "Good");
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));

    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent("Your changes are saved. The listing is back in review.");
    expect(notice).toHaveFocus();
    expect(sent).toEqual({ car: { price: 259000, stateId: 3 } });
    expect(router.state.location.search).toBe("");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes without a request when nothing changed", async () => {
    const user = userEvent.setup();
    let requested = false;
    server.use(
      http.patch("*/api/listings/7", () => {
        requested = true;
        return HttpResponse.json({ listing: { id: 7 } });
      }),
    );
    const router = renderList([row]);

    const dialog = await openDrawer(user);
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));

    expect(router.state.location.search).toBe("");
    expect(requested).toBe(false);
  });

  it("shows the API's errors next to their inputs", async () => {
    const user = userEvent.setup();
    server.use(
      http.patch("*/api/listings/7", () =>
        apiErrors(400, { code: "validation.invalid_type", message: "Enter a price", field: "car.price" }),
      ),
    );
    renderList([row]);

    const dialog = await openDrawer(user);
    await user.clear(within(dialog).getByLabelText("Price"));
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));

    const price = within(dialog).getByLabelText("Price");
    expect(await within(dialog).findByText("Enter a price")).toBeInTheDocument();
    expect(price).toHaveFocus();
    expect(price).toHaveAccessibleDescription("Enter a price");
  });

  it("deletes the listing after confirming, and closes", async () => {
    const user = userEvent.setup();
    server.use(
      http.delete("*/api/listings/7", () => HttpResponse.json({ deleted: true, listingId: 7 })),
    );
    const router = renderList([row]);

    const drawer = await openDrawer(user);
    await user.click(within(drawer).getByRole("button", { name: "Delete listing" }));
    const confirm = await screen.findByRole("dialog", { name: "Delete this listing?" });
    await user.click(within(confirm).getByRole("button", { name: "Delete listing" }));

    expect(await screen.findByText("“My Golf” was deleted.")).toBeInTheDocument();
    expect(router.state.location.search).toBe("");
  });

  it("names the action per status, and offers none for a sold car", async () => {
    renderList([
      { ...row, id: 2, title: "Rejected car", status: "rejected" },
      { ...row, id: 3, title: "Sold car", status: "sold" },
    ]);

    const table = await screen.findByRole("table");

    expect(within(table).getByRole("link", { name: "Edit and resubmit Rejected car" })).toHaveAttribute(
      "href",
      "/my-listings?edit=2",
    );
    expect(within(table).queryByRole("link", { name: /Sold car/u })).not.toBeInTheDocument();
    expect(within(table).getByRole("link", { name: "Photos and videos of Rejected car" })).toHaveAttribute(
      "href",
      "/my-listings/2/media",
    );
  });

  it("gives the focus back to the menu when opened from it", async () => {
    const user = userEvent.setup();
    renderList([row]);

    // The cards' menu, for small screens, holds the edit action.
    const cards = (await screen.findAllByRole("list")).find((list) => list.tagName === "UL" && within(list).queryByText("My Golf"));
    const trigger = within(cards ?? document.body).getByRole("button", { name: "Actions for My Golf" });
    await user.click(trigger);
    await user.click(screen.getByRole("link", { name: "Edit" }));

    expect(await screen.findByRole("dialog", { name: "My Golf" })).toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("links to the page that manages photos and videos", async () => {
    const user = userEvent.setup();
    renderList([row]);

    const dialog = await openDrawer(user);

    expect(within(dialog).getByRole("link", { name: "Manage all photos and videos" })).toHaveAttribute(
      "href",
      "/my-listings/7/media",
    );
  });
});
