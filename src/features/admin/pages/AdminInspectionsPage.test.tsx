import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { emptyOverview, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";
import type { AdminInspection } from "../inspectionsApi";

const inspection = (id: number, changes: Partial<AdminInspection> = {}): AdminInspection => ({
  id,
  status: "completed",
  verdict: "good",
  overallScore: 82,
  priceAtRequest: 350,
  requestedAt: "2026-11-10T09:00:00.000Z",
  acceptedAt: "2026-11-10T10:00:00.000Z",
  completedAt: "2026-11-12T16:00:00.000Z",
  hasReport: true,
  buyer: { id: 21, firstName: "Nadia", lastName: "Bennani" },
  mechanic: { id: 7, name: "Atlas Auto Care" },
  car: { id: 300 + id, listingId: 4812, year: 2021, make: "Dacia", model: "Duster", removed: false },
  ...changes,
});

const adminApi = () => {
  const queries: string[] = [];
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "admin" } }),
    ),
    http.get("*/api/admin/overview", () =>
      HttpResponse.json({
        ...emptyOverview,
        inspections: { byStatus: { ...emptyOverview.inspections.byStatus, completed: 40, pending: 3 } },
      }),
    ),
    http.get("*/api/admin/inspections", ({ request }) => {
      queries.push(new URL(request.url).search);
      return HttpResponse.json({
        inspections: [
          inspection(91),
          inspection(88, {
            status: "cancelled",
            verdict: null,
            overallScore: null,
            hasReport: false,
            completedAt: null,
            car: { id: null, listingId: null, year: 2019, make: "Renault", model: "Clio", removed: true },
          }),
        ],
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });
    }),
  );
  return { queries };
};

describe("admin inspections", () => {
  it("lists every inspection with its car, people, status and result", async () => {
    adminApi();
    renderApp("/admin/inspections");

    const table = within(await screen.findByRole("table", { name: "Inspections" }));
    const [, done, cancelled] = table.getAllByRole("row");
    expect(within(done!).getByRole("link", { name: "Dacia Duster 2021" })).toHaveAttribute("href", "/listings/4812");
    expect(within(done!).getByRole("link", { name: "Nadia Bennani" })).toHaveAttribute("href", "/admin/users/21");
    expect(done).toHaveTextContent("Good");
    expect(done).toHaveTextContent("82/100");
    expect(done).toHaveTextContent("Sent");

    expect(cancelled).toHaveTextContent("Renault Clio 2019");
    expect(cancelled).toHaveTextContent("Car deleted");
    expect(cancelled).toHaveTextContent("Not yet");
    expect(within(cancelled!).queryByRole("link", { name: "Renault Clio 2019" })).not.toBeInTheDocument();

    const menu = within(screen.getByRole("navigation", { name: "Admin" }));
    expect(menu.getByRole("link", { name: "Inspections" })).toHaveAttribute("aria-current", "page");
  });

  it("filters by status, workshop and buyer", async () => {
    const user = userEvent.setup();
    const { queries } = adminApi();
    renderApp("/admin/inspections?buyerId=21");

    expect(await screen.findByText("Inspections requested by Nadia Bennani")).toBeInTheDocument();
    expect(queries).toEqual(["?page=1&buyerId=21"]);
    const tabs = within(screen.getByRole("navigation", { name: "Inspection status" }));
    await user.click(tabs.getByRole("link", { name: "Completed" }));
    await waitFor(() => expect(queries.at(-1)).toBe("?page=1&status=completed&buyerId=21"));

    await user.click(screen.getAllByRole("link", { name: "Inspections of Atlas Auto Care" })[0]!);
    await waitFor(() => expect(queries.at(-1)).toBe("?page=1&status=completed&buyerId=21&mechanicId=7"));
    await user.click(screen.getByRole("button", { name: "Show every buyer" }));
    await waitFor(() => expect(queries.at(-1)).toBe("?page=1&status=completed&mechanicId=7"));
    expect(screen.getByText("Inspections of Atlas Auto Care", { selector: "span" })).toBeInTheDocument();
  });
});
