import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

const savedListing = (id: number, title: string, status = "approved") => ({
  id,
  title,
  status,
  savedAt: "2026-01-02T10:00:00.000Z",
  inspectionScore: id === 7 ? 88 : null,
  car: {
    id: id + 100,
    makeId: 482,
    modelId: 10,
    price: 245000,
    year: 2021,
    distance: "72000",
    transmission: "automatic",
    carburant: { carburant: "diesel" },
    carMedias: [{ type: "image", link: `http://storage.test/cars/${id}.jpg`, isPrimary: true }],
    city: { name: "Casablanca", slug: "casablanca" },
  },
});

const signIn = (role = "buyer") =>
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role } }),
    ),
  );

// The buyer keeps three cars: one inspected, one not, one sold. Records each
// request and each removal.
const savedApi = () => {
  const kept = new Map([
    [7, savedListing(7, "Toyota Corolla Hybrid")],
    [8, savedListing(8, "Fiat 500 Dolcevita")],
    [9, savedListing(9, "Kia Sportage GT-Line", "sold")],
  ]);
  const queries: URLSearchParams[] = [];
  server.use(
    http.get("*/api/favorite_listings", ({ request }) => {
      const query = new URL(request.url).searchParams;
      queries.push(query);
      const inspected = query.get("inspected");
      const listings = [...kept.values()].filter(
        ({ inspectionScore }) =>
          inspected === null || (inspected === "true") === (inspectionScore !== null),
      );
      return HttpResponse.json({
        listings,
        meta: { total: listings.length, page: 1, limit: 12, totalPages: 1 },
        counts: { all: kept.size, inspected: kept.has(7) ? 1 : 0 },
      });
    }),
    http.get("*/api/favorite_listings/ids", () => HttpResponse.json({ listingIds: [...kept.keys()] })),
    http.delete("*/api/favorite_listings/:listingId", ({ params }) => {
      kept.delete(Number(params.listingId));
      return HttpResponse.json({ count: 1 });
    }),
  );
  return queries;
};

const summary = (text: string) => (_: string, element: Element | null) =>
  element?.tagName === "P" && element.textContent === text;

describe("SavedPage", () => {
  it("lists the buyer's saved cars with their counts", async () => {
    signIn();
    savedApi();
    renderApp("/saved");

    expect(await screen.findByRole("heading", { level: 1, name: "Saved cars" })).toBeInTheDocument();
    expect(
      await screen.findByText(summary("3 cars · 1 already inspected · tap the heart to remove")),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Toyota Corolla Hybrid" })).toHaveAttribute("href", "/listings/7");
    expect(
      await screen.findByRole("button", { name: "Save Toyota Corolla Hybrid to favourites", pressed: true }),
    ).toBeInTheDocument();
    expect(screen.getByText("You've reached the end of your saved cars")).toBeInTheDocument();

    const filters = within(screen.getByRole("list", { name: "Show saved cars" }));
    expect(filters.getByRole("button", { name: "All 3", pressed: true })).toBeInTheDocument();
    expect(filters.getByRole("button", { name: "Inspected 1" })).toBeInTheDocument();
    expect(filters.getByRole("button", { name: "Not inspected 2" })).toBeInTheDocument();
  });

  it("shows a sold car without its link, with a way to remove it or find similar cars", async () => {
    const user = userEvent.setup();
    signIn();
    savedApi();
    renderApp("/saved");

    expect(await screen.findByText("Sold")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Kia Sportage GT-Line" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Find cars like Kia Sportage GT-Line" })).toHaveAttribute(
      "href",
      "/cars?makeId=482&modelId=10",
    );

    await user.click(screen.getByRole("button", { name: "Remove Kia Sportage GT-Line from saved cars" }));
    await waitFor(() => expect(screen.queryByText("Kia Sportage GT-Line")).not.toBeInTheDocument());
  });

  it("removes a car when its heart is tapped", async () => {
    const user = userEvent.setup();
    signIn();
    savedApi();
    renderApp("/saved");

    const heart = await screen.findByRole("button", { name: "Save Fiat 500 Dolcevita to favourites", pressed: true });
    await user.click(heart);
    await waitFor(() => expect(screen.queryByText("Fiat 500 Dolcevita")).not.toBeInTheDocument());
    expect(await screen.findByText(summary("2 cars · 1 already inspected · tap the heart to remove"))).toBeInTheDocument();
  });

  it("filters by inspection and sorts, keeping both in the address", async () => {
    const user = userEvent.setup();
    signIn();
    const queries = savedApi();
    const router = renderApp("/saved");

    await user.click(await screen.findByRole("button", { name: "Inspected 1" }));
    expect(router.state.location.search).toBe("?inspected=true");
    await waitFor(() => expect(screen.queryByText("Fiat 500 Dolcevita")).not.toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText("Sort by"), "Price: high to low");
    expect(router.state.location.search).toBe("?inspected=true&sort=price_desc");
    expect(queries.at(-1)?.toString()).toBe("sort=price_desc&page=1&limit=12&inspected=true");
  });

  it("invites a buyer with no saved cars to explore", async () => {
    signIn();
    server.use(
      http.get("*/api/favorite_listings", () =>
        HttpResponse.json({
          listings: [],
          meta: { total: 0, page: 1, limit: 12, totalPages: 0 },
          counts: { all: 0, inspected: 0 },
        }),
      ),
    );
    renderApp("/saved");

    expect(await screen.findByRole("heading", { name: "No saved cars yet" })).toBeInTheDocument();
    const list = within(screen.getByRole("region", { name: "Saved cars" }));
    expect(list.getByRole("link", { name: "Explore cars" })).toHaveAttribute("href", "/");
  });

  it("is only for buyers", async () => {
    signIn("seller");
    renderApp("/saved");

    expect(await screen.findByRole("heading", { name: "You can't open this page" })).toBeInTheDocument();
  });

  it("links to the saved cars from the main navigation, the header heart and the tab bar", async () => {
    signIn();
    savedApi();
    renderApp("/");

    const links = await screen.findAllByRole("link", { name: /^Saved/u });
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/saved", "/saved", "/saved"]);
  });
});
