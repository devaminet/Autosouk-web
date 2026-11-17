import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { emptyOverview, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";
import type { AdminListing } from "../listingsApi";

const seller = { id: 12, firstName: "Karim", lastName: "Tazi", email: "karim@example.com", suspendedAt: "2026-11-17T09:42:00.000Z" };

const listing = (id: number, title: string, changes: Partial<AdminListing> = {}): AdminListing => ({
  id,
  title,
  status: "approved",
  rejectionReason: null,
  approvedAt: "2026-11-12",
  createdAt: "2026-11-12",
  updatedAt: "2026-11-12",
  seller,
  car: { id: 100 + id, price: 185000, year: 2021, make: "Dacia", model: "Duster", city: "casablanca" },
  ...changes,
});

const adminApi = () => {
  const queries: string[] = [];
  const deleted: unknown[] = [];
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "admin" } }),
    ),
    http.get("*/api/admin/overview", () =>
      HttpResponse.json({
        ...emptyOverview,
        listings: { byStatus: { ...emptyOverview.listings.byStatus, approved: 342, pending: 5 } },
        queues: { ...emptyOverview.queues, listings: 5 },
      }),
    ),
    http.get("*/api/admin/listings", ({ request }) => {
      queries.push(new URL(request.url).search);
      return HttpResponse.json({
        listings: [
          listing(4812, "Dacia Duster 2021 · Diesel"),
          listing(4801, "Renault Clio 5", { status: "rejected", rejectionReason: "Blurry photos", seller: { ...seller, suspendedAt: null } }),
          listing(4788, "Untitled draft", { status: "draft", car: null, seller: { ...seller, suspendedAt: null } }),
        ],
        meta: { total: 3, page: 1, limit: 20, totalPages: 1 },
      });
    }),
    http.delete("*/api/admin/listings/:id", async ({ params, request }) => {
      deleted.push({ id: params.id, body: await request.json() });
      return HttpResponse.json({ deleted: true, listingId: Number(params.id) });
    }),
  );
  return { queries, deleted };
};

describe("admin listings", () => {
  it("lists every listing with its car, status and seller", async () => {
    adminApi();
    renderApp("/admin/listings");

    const table = within(await screen.findByRole("table", { name: "Listings" }));
    const [, duster, clio, draft] = table.getAllByRole("row");
    expect(duster).toHaveTextContent("#4812 · Dacia Duster 2021 · Casablanca");
    expect(duster).toHaveTextContent("Seller suspended");
    expect(within(duster!).getByRole("link", { name: "Karim Tazi" })).toHaveAttribute("href", "/admin/users/12");
    expect(within(duster!).getByRole("link", { name: "Open Dacia Duster 2021 · Diesel" })).toHaveAttribute(
      "href",
      "/listings/4812",
    );
    expect(clio).toHaveTextContent("Blurry photos");
    expect(draft).toHaveTextContent("No car yet");

    const menu = within(screen.getByRole("navigation", { name: "Admin" }));
    expect(await menu.findByRole("link", { name: "Listings 5 waiting" })).toHaveAttribute("aria-current", "page");
  });

  it("filters by status and by seller", async () => {
    const user = userEvent.setup();
    const { queries } = adminApi();
    renderApp("/admin/listings?sellerId=12");

    expect(await screen.findByText("Listings of Karim Tazi")).toBeInTheDocument();
    expect(queries).toEqual(["?page=1&sellerId=12"]);
    const tabs = within(screen.getByRole("navigation", { name: "Listing status" }));
    await user.click(await tabs.findByRole("link", { name: /^Pending review/u }));
    await waitFor(() => expect(queries.at(-1)).toBe("?page=1&status=pending&sellerId=12"));
    await user.click(screen.getByRole("button", { name: "Show every seller" }));
    await waitFor(() => expect(queries.at(-1)).toBe("?page=1&status=pending"));
  });

  it("deletes a listing with a reason", async () => {
    const user = userEvent.setup();
    const { deleted } = adminApi();
    renderApp("/admin/listings");

    await user.click(await screen.findByRole("button", { name: "Delete Dacia Duster 2021 · Diesel" }));
    const dialog = within(screen.getByRole("dialog", { name: "Delete “Dacia Duster 2021 · Diesel”?" }));
    expect(dialog.getByText("Buyers keep the car's inspections and their reports")).toBeInTheDocument();
    await user.type(dialog.getByLabelText("Why are you deleting this listing?"), "Stolen photos");
    await user.click(dialog.getByRole("button", { name: "Delete the listing" }));

    expect(await screen.findByText("“Dacia Duster 2021 · Diesel” was deleted.")).toBeInTheDocument();
    expect(deleted).toEqual([{ id: "4812", body: { reason: "Stolen photos" } }]);
  });
});
