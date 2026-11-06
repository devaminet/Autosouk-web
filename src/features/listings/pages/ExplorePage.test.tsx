import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { apiErrors, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

const publicListing = (id: number, title: string) => ({
  id,
  title,
  description: "Clean car",
  createdAt: "2024-03-02T10:00:00.000Z",
  user: { firstName: "Karim", lastName: "El Idrissi", phone: "0600000000", imageUrl: null },
  inspectionScore: id === 7 ? 92 : null,
  car: {
    price: 265000,
    year: 2020,
    distance: "54000",
    transmission: "automatic",
    carburant: { carburant: "diesel" },
    carMedias: [
      { type: "image", link: `http://storage.test/cars/${id}.jpg`, isPrimary: true },
      { type: "video", link: `http://storage.test/cars/${id}.mp4`, isPrimary: false },
    ],
    city: { name: "Casablanca", slug: "casablanca" },
  },
});

// Records every search the page sends, and answers with two listings.
const listingsApi = () => {
  const queries: URLSearchParams[] = [];
  server.use(
    http.get("*/api/listings", ({ request }) => {
      const query = new URL(request.url).searchParams;
      queries.push(query);
      const total = query.get("limit") === "1" ? 1248 : 2;
      return HttpResponse.json({
        listings: [publicListing(7, "Volkswagen Golf 8"), publicListing(8, "Dacia Duster")],
        meta: { total, page: Number(query.get("page") ?? 1), limit: 8, totalPages: 1 },
      });
    }),
  );
  return queries;
};

const results = () => within(screen.getByRole("region", { name: /listed|matching/u }));

describe("ExplorePage", () => {
  it("shows the latest approved listings, each linking to its page", async () => {
    listingsApi();
    renderApp("/");

    expect(await screen.findByRole("heading", { level: 1, name: "Find a car you can trust." })).toBeInTheDocument();
    const link = await screen.findByRole("link", { name: "Volkswagen Golf 8" });
    expect(link).toHaveAttribute("href", "/listings/7");
    expect(results().getByText("2 cars")).toBeInTheDocument();
    expect(results().getAllByText("Casablanca")).toHaveLength(2);
    expect(results().getAllByText("2 photos and videos")).toHaveLength(2);
    expect(await screen.findByText("1 248 cars on AutoSouk")).toBeInTheDocument();
  });

  it("shows each car's price, specs and inspection score", async () => {
    listingsApi();
    renderApp("/");

    const card = within((await screen.findByRole("link", { name: "Volkswagen Golf 8" })).closest("li") ?? document.body);
    expect(card.getByText(/^265.000$/u)).toBeInTheDocument();
    expect(card.getByText((_, element) => element?.tagName === "P" && /^2020 · 54.000 km · Diesel · Automatic$/u.test(element.textContent ?? ""))).toBeInTheDocument();
    expect(card.getByText((_, element) => element?.tagName === "SPAN" && element.textContent === "Inspected · 92")).toBeInTheDocument();
    // A car never inspected has no score.
    const other = within(screen.getByRole("link", { name: "Dacia Duster" }).closest("li") ?? document.body);
    expect(other.queryByText(/Inspected/u)).not.toBeInTheDocument();
  });

  it("searches by make, model and price, and keeps the search in the address", async () => {
    const user = userEvent.setup();
    const queries = listingsApi();
    const router = renderApp("/");

    const search = within(await screen.findByLabelText("Search cars"));
    await user.selectOptions(search.getByLabelText("Make"), await search.findByRole("option", { name: "VOLKSWAGEN" }));
    await user.selectOptions(search.getByLabelText("Model"), await search.findByRole("option", { name: "Golf" }));
    await user.type(search.getByLabelText("Max price"), "300 000");
    await user.click(search.getByRole("button", { name: "Search" }));

    expect(await screen.findByRole("heading", { name: "Cars matching your search" })).toBeInTheDocument();
    expect(router.state.location.search).toBe("?makeId=482&modelId=10&maxPrice=300000");
    const last = queries.at(-1);
    expect(last?.get("makeId")).toBe("482");
    expect(last?.get("modelId")).toBe("10");
    expect(last?.get("maxPrice")).toBe("300000");
    expect(last?.get("limit")).toBe("8");
  });

  it("filters by city from the address and names it", async () => {
    const queries = listingsApi();
    renderApp("/?cityId=1");

    expect(await screen.findByText("In Casablanca")).toBeInTheDocument();
    expect(queries.some((query) => query.get("cityId") === "1")).toBe(true);
    // The full search page keeps the same search.
    expect(results().getByRole("link", { name: "View all" })).toHaveAttribute("href", "/cars?cityId=1");
  });

  it("sorts and applies the budget chip", async () => {
    const user = userEvent.setup();
    const queries = listingsApi();
    const router = renderApp("/");

    await user.selectOptions(await screen.findByLabelText("Sort by"), "Price: low to high");
    expect(router.state.location.search).toBe("?sort=price_asc");

    await user.click(screen.getByRole("button", { name: /^Under 150.000 MAD$/u }));
    expect(router.state.location.search).toBe("?maxPrice=150000&sort=price_asc");
    expect(screen.getByRole("button", { name: /^Under 150.000 MAD$/u })).toHaveAttribute("aria-pressed", "true");
    expect(queries.at(-1)?.get("sort")).toBe("price_asc");

    await user.click(screen.getByRole("button", { name: "All cars" }));
    expect(router.state.location.search).toBe("?sort=price_asc");
  });

  it("offers to clear a search that finds nothing", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/api/listings", () =>
        HttpResponse.json({ listings: [], meta: { total: 0, page: 1, limit: 8, totalPages: 0 } }),
      ),
    );
    const router = renderApp("/?cityId=2");

    expect(await screen.findByText("No cars match your search.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear the search" }));

    expect(router.state.location.search).toBe("");
    expect(await screen.findByText("No cars are listed yet. Check back soon.")).toBeInTheDocument();
  });

  it("shows the API's error with a way to retry", async () => {
    server.use(
      http.get("*/api/listings", () =>
        apiErrors(400, { code: "validation.invalid_type.number", message: "Must be a number" }),
      ),
    );
    renderApp("/");

    // The client asks once more before giving up.
    expect(await screen.findByText("Must be a number", {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("invites guests and sellers to list a car, but not buyers", async () => {
    listingsApi();
    renderApp("/");
    expect(await screen.findByRole("link", { name: "List your car" })).toHaveAttribute("href", "/register");
  });

  it("greets a signed-in buyer without the seller invitation", async () => {
    listingsApi();
    server.use(
      http.post("*/api/auth/refresh-token", () => HttpResponse.json({ accessToken: "token", user: testUser })),
    );
    renderApp("/");

    expect(await screen.findByText("Salam, Amine")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "List your car" })).not.toBeInTheDocument();
  });
});
