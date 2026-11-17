import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { emptyOverview, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";
import type { AdminUser } from "../usersApi";

const summary = (id: number, firstName: string, changes: object = {}) => ({
  id,
  firstName,
  lastName: "Tazi",
  email: `${firstName.toLowerCase()}@example.com`,
  phone: "+212661234567",
  role: "seller",
  emailVerified: true,
  phoneVerifiedAt: "2026-11-01T10:00:00.000Z",
  identityStatus: "approved",
  suspendedAt: null,
  createdAt: "2026-02-03",
  ...changes,
});

const mechanic: AdminUser = {
  id: 7,
  firstName: "Hamid",
  lastName: "Mansouri",
  email: "hamid@example.com",
  phone: "+212612345678",
  role: "mechanic",
  imageUrl: null,
  isVerified: true,
  phoneVerifiedAt: "2026-11-10T10:00:00.000Z",
  twoFactorEnabled: false,
  identityStatus: "pending",
  locale: "fr",
  suspendedAt: "2026-11-17T09:42:00.000Z",
  suspensionReason: "Two buyers reported fake inspection reports.",
  createdAt: "2026-11-10",
  city: { name: "Casablanca", slug: "casablanca" },
  signedInDevices: 0,
  listings: { byStatus: { draft: 0, pending: 0, approved: 2, withdrawn: 0, rejected: 0, sold: 1 } },
  inspectionsRequested: 0,
  mechanic: {
    id: 3,
    name: "Garage Atlas Auto",
    isActive: true,
    inspectionPrice: 350,
    city: { name: "Casablanca", slug: "casablanca" },
    inspections: 27,
    verification: { kind: "garage", status: "approved", bookable: false, validUntil: "2031-03-14" },
  },
  history: [
    {
      id: 30,
      action: "user.suspended",
      targetType: "user",
      targetId: 7,
      details: { reason: "Two buyers reported fake inspection reports." },
      createdAt: "2026-11-17T09:42:00.000Z",
      actor: { id: 1, firstName: "Salma", lastName: "Rami" },
    },
  ],
};

const adminApi = () => {
  const queries: string[] = [];
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "admin" } }),
    ),
    http.get("*/api/admin/overview", () =>
      HttpResponse.json({ ...emptyOverview, users: { ...emptyOverview.users, total: 1284, suspended: 12 } }),
    ),
    http.get("*/api/admin/users", ({ request }) => {
      queries.push(new URL(request.url).search);
      return HttpResponse.json({
        users: [
          summary(12, "Karim", { suspendedAt: "2026-11-17T09:42:00.000Z" }),
          summary(13, "Nadia", { role: "buyer", phoneVerifiedAt: null, identityStatus: "pending" }),
        ],
        meta: { total: 45, page: 1, limit: 20, totalPages: 3 },
      });
    }),
    http.get("*/api/admin/users/7", () => HttpResponse.json(mechanic)),
  );
  return queries;
};

describe("admin users", () => {
  it("lists accounts with their checks and status", async () => {
    const queries = adminApi();
    renderApp("/admin/users");

    const table = within(await screen.findByRole("table", { name: "Accounts" }));
    const [, karim, nadia] = table.getAllByRole("row");
    expect(karim).toHaveTextContent("Karim Tazi");
    expect(karim).toHaveTextContent("Suspended");
    expect(nadia).toHaveTextContent("Being checked");
    expect(within(nadia!).getByRole("link", { name: "Open Nadia Tazi" })).toHaveAttribute("href", "/admin/users/13");
    expect(screen.getByText("1–20 of 45")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Page 2" })).toHaveAttribute("href", "/admin/users?page=2");
    expect(queries).toEqual(["?page=1"]);
    const tabs = within(screen.getByRole("navigation", { name: "Account status" }));
    expect(await tabs.findByRole("link", { name: /^Suspended/u })).toHaveTextContent("12");
  });

  it("filters by role, status and search, from the first page", async () => {
    const user = userEvent.setup();
    const queries = adminApi();
    renderApp("/admin/users?page=2");

    await screen.findByRole("table", { name: "Accounts" });
    await user.selectOptions(screen.getByLabelText("Role"), "seller");
    await waitFor(() => expect(queries.at(-1)).toBe("?page=1&role=seller"));
    await user.click(within(screen.getByRole("navigation", { name: "Account status" })).getByRole("link", { name: /^Suspended/u }));
    await waitFor(() => expect(queries.at(-1)).toBe("?page=1&role=seller&status=suspended"));
    await user.type(screen.getByLabelText("Search"), "karim");
    await waitFor(() => expect(queries.at(-1)).toBe("?page=1&search=karim&role=seller&status=suspended"));
  });

  it("shows one account in full", async () => {
    adminApi();
    renderApp("/admin/users/7");

    expect(await screen.findByRole("heading", { name: "Hamid Mansouri", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Reason: Two buyers reported fake inspection reports.")).toBeInTheDocument();
    const checks = within(screen.getByRole("region", { name: "Checks" }));
    expect(checks.getByText("Always on for this role")).toBeInTheDocument();
    expect(checks.getByText("Being checked")).toBeInTheDocument();
    const activity = within(screen.getByRole("region", { name: "Activity" }));
    expect(activity.getByText(/Approved/u)).toHaveTextContent("Approved 2");
    const workshop = within(screen.getByRole("region", { name: "Workshop" }));
    expect(workshop.getByText("Garage Atlas Auto")).toBeInTheDocument();
    expect(workshop.getByText("27")).toBeInTheDocument();
    const history = within(screen.getByRole("region", { name: "History" }));
    expect(history.getByText("Suspended account")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open the review" })).toHaveAttribute("href", "/admin/verifications/7");
  });
});
