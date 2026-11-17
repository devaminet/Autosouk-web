import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { emptyOverview, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

const overview = {
  users: { total: 1284, byRole: { buyer: 902, seller: 214, mechanic: 160, admin: 8 }, suspended: 12 },
  listings: { byStatus: { ...emptyOverview.listings.byStatus, approved: 342, pending: 5 } },
  mechanics: { total: 160, bookable: 142 },
  inspections: { byStatus: { ...emptyOverview.inspections.byStatus, completed: 918, in_progress: 20, pending: 4 } },
  queues: { verifications: 4, listings: 5, identityChecks: 2, mechanicDocuments: 3 },
};

const adminApi = () => {
  const queries: string[] = [];
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "admin" } }),
    ),
    http.get("*/api/admin/overview", () => HttpResponse.json(overview)),
    http.get("*/api/admin/audit-log", ({ request }) => {
      queries.push(new URL(request.url).search);
      return HttpResponse.json({
        entries: [
          {
            id: 9,
            action: "user.suspended",
            targetType: "user",
            targetId: 12,
            details: { reason: "Fake listings" },
            createdAt: "2026-11-17T09:42:00.000Z",
            actor: { id: 1, firstName: "Salma", lastName: "Rami" },
          },
          {
            id: 8,
            action: "listing.featured",
            targetType: "listing",
            targetId: 4812,
            details: null,
            createdAt: "2026-11-17T09:10:00.000Z",
            actor: null,
          },
        ],
        actions: ["user.suspended"],
        meta: { total: 2, page: 1, limit: 5, totalPages: 1 },
      });
    }),
  );
  return queries;
};

describe("admin overview", () => {
  it("shows the site in figures and what waits", async () => {
    adminApi();
    renderApp("/admin");

    expect(await screen.findByRole("heading", { name: "Overview", level: 1 })).toBeInTheDocument();
    expect(await screen.findByText(/^1\s284$/u)).toBeInTheDocument();
    expect(screen.getByText("12 suspended")).toBeInTheDocument();
    expect(screen.getByText("342")).toBeInTheDocument();
    expect(screen.getByText("5 waiting for review")).toBeInTheDocument();
    expect(screen.getByText("of 160 workshops")).toBeInTheDocument();
    expect(screen.getByText("24 under way")).toBeInTheDocument();

    const queues = within(screen.getByRole("region", { name: "Waiting for you" }));
    expect(queues.getByText("Verifications")).toBeInTheDocument();
    expect(queues.getByText("Listings to review")).toBeInTheDocument();

    const roles = within(screen.getByRole("region", { name: "Users by role" }));
    expect(roles.getByText("Buyers").nextElementSibling).toHaveTextContent("902");
    expect(roles.getByText("12 accounts suspended")).toBeInTheDocument();

    const menu = within(screen.getByRole("navigation", { name: "Admin" }));
    expect(menu.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    expect(await menu.findByRole("link", { name: "Verifications 4 waiting" })).toHaveAttribute("href", "/admin/verifications");
    expect(queues.getAllByRole("link", { name: "Review" }).map((link) => link.getAttribute("href"))).toEqual([
      "/admin/verifications",
      "/admin/listings?status=pending",
    ]);
  });

  it("lists the latest admin actions, with their reasons", async () => {
    const queries = adminApi();
    renderApp("/admin");

    const activity = within(await screen.findByRole("table", { name: "Latest admin actions" }));
    expect(queries).toEqual(["?limit=5"]);
    const [, suspended, unknown] = activity.getAllByRole("row");
    expect(suspended).toHaveTextContent("Salma Rami");
    expect(suspended).toHaveTextContent("Suspended account");
    expect(suspended).toHaveTextContent("User #12");
    expect(suspended).toHaveTextContent("Fake listings");
    // An action the client doesn't know yet shows as the API sends it.
    expect(unknown).toHaveTextContent("listing.featured");
    expect(unknown).toHaveTextContent("AutoSouk");
  });
});
