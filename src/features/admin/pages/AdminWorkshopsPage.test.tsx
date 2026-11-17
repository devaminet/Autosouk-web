import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { emptyOverview, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";
import type { AdminWorkshop } from "../workshopsApi";

const owner = { id: 31, firstName: "Youssef", lastName: "Alami", email: "youssef@example.com", suspendedAt: null };

const workshop = (id: number, name: string, changes: Partial<AdminWorkshop> = {}): AdminWorkshop => ({
  id,
  name,
  city: "casablanca",
  isActive: true,
  inspectionPrice: 350,
  bookable: true,
  awaitingReview: false,
  averageRating: 4.5,
  reviewsCount: 12,
  completedInspections: 40,
  createdAt: "2026-10-02",
  user: owner,
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
        mechanics: { total: 9, bookable: 6 },
        queues: { ...emptyOverview.queues, mechanicDocuments: 2 },
      }),
    ),
    http.get("*/api/admin/mechanics", ({ request }) => {
      queries.push(new URL(request.url).search);
      return HttpResponse.json({
        mechanics: [
          workshop(7, "Atlas Auto Care"),
          workshop(5, "Garage Nour", {
            bookable: false,
            awaitingReview: true,
            averageRating: null,
            reviewsCount: 0,
            user: { ...owner, id: 32, firstName: "Salma", lastName: "Idrissi", suspendedAt: "2026-11-17T09:42:00.000Z" },
          }),
        ],
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      });
    }),
  );
  return { queries };
};

describe("admin workshops", () => {
  it("lists every workshop with its owner, status and rating", async () => {
    adminApi();
    renderApp("/admin/workshops");

    const table = within(await screen.findByRole("table", { name: "Workshops" }));
    const [, atlas, nour] = table.getAllByRole("row");
    expect(atlas).toHaveTextContent("#7 · Casablanca");
    expect(atlas).toHaveTextContent("Bookable");
    expect(atlas).toHaveTextContent("12 reviews");
    expect(within(atlas!).getByRole("link", { name: "Youssef Alami" })).toHaveAttribute("href", "/admin/users/31");
    expect(within(atlas!).getByRole("link", { name: "Open Atlas Auto Care" })).toHaveAttribute("href", "/mechanics/7");
    expect(within(atlas!).queryByRole("link", { name: /^Review/u })).not.toBeInTheDocument();

    expect(nour).toHaveTextContent("Not bookable");
    expect(nour).toHaveTextContent("Owner suspended");
    expect(nour).toHaveTextContent("No reviews yet");
    expect(within(nour!).getByRole("link", { name: "Review the documents of Garage Nour" })).toHaveAttribute(
      "href",
      "/admin/verifications/32",
    );
    expect(within(nour!).queryByRole("link", { name: "Open Garage Nour" })).not.toBeInTheDocument();

    const menu = within(screen.getByRole("navigation", { name: "Admin" }));
    expect(menu.getByRole("link", { name: "Workshops" })).toHaveAttribute("aria-current", "page");
  });

  it("filters by status and city", async () => {
    const user = userEvent.setup();
    const { queries } = adminApi();
    renderApp("/admin/workshops");

    const tabs = within(await screen.findByRole("navigation", { name: "Workshop status" }));
    await user.click(await tabs.findByRole("link", { name: /^Documents to review\s*2/u }));
    await waitFor(() => expect(queries.at(-1)).toBe("?page=1&status=awaiting_review"));

    const city = screen.getByLabelText("City");
    await waitFor(() => expect(city).toBeEnabled());
    await user.selectOptions(city, "Agadir");
    await waitFor(() => expect(queries.at(-1)).toBe("?page=1&status=awaiting_review&cityId=2"));
  });
});
