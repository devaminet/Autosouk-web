import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
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
    carMedias: [{ type: "image", link: `http://storage.test/cars/${id}.jpg`, isPrimary: true }],
    city: { name: "Casablanca", slug: "casablanca" },
  },
});

// Records every search the page sends. The filters' preview asks for one
// listing to learn the count, and finds 5.
const listingsApi = () => {
  const queries: URLSearchParams[] = [];
  server.use(
    http.get("*/api/listings", ({ request }) => {
      const query = new URL(request.url).searchParams;
      queries.push(query);
      const preview = query.get("limit") === "1";
      return HttpResponse.json({
        listings: [publicListing(7, "Volkswagen Golf 8"), publicListing(8, "Volkswagen Polo")],
        meta: { total: preview ? 5 : 2, page: Number(query.get("page") ?? 1), limit: preview ? 1 : 9, totalPages: 1 },
      });
    }),
  );
  return queries;
};

const filters = () => within(screen.getByRole("form", { name: "Filters" }));

// Text split by number isolation, matched on the whole paragraph.
const paragraph = (text: string) => (_: string, element: Element | null) =>
  element?.tagName === "P" && element.textContent?.replaceAll(/\s/gu, " ") === text;

describe("SearchPage", () => {
  it("reads the search from the address and names it", async () => {
    const queries = listingsApi();
    renderApp("/cars?makeId=482&modelId=10&cityId=1&minPrice=80000&maxPrice=300000&equipmentIds=30");

    expect(
      await screen.findByRole("heading", { level: 1, name: "VOLKSWAGEN Golf in Casablanca" }),
    ).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Volkswagen Golf 8" })).toHaveAttribute("href", "/listings/7");
    expect(screen.getByText("2 cars")).toBeInTheDocument();
    expect(screen.getByText(paragraph("Showing 1–2 of 2"))).toBeInTheDocument();

    const active = within(screen.getByRole("list", { name: "Filters in use" }));
    expect(await active.findByRole("button", { name: "Remove the filter Apple CarPlay" })).toBeInTheDocument();
    expect(active.getByRole("button", { name: "Remove the filter Casablanca" })).toBeInTheDocument();
    expect(active.getByRole("button", { name: /^Remove the filter 80.000 – 300.000 MAD$/u })).toBeInTheDocument();

    const search = queries.find((query) => query.get("limit") === "9");
    expect(search?.get("makeId")).toBe("482");
    expect(search?.get("modelId")).toBe("10");
    expect(search?.get("cityId")).toBe("1");
    expect(search?.get("minPrice")).toBe("80000");
    expect(search?.get("maxPrice")).toBe("300000");
    expect(search?.get("equipmentIds")).toBe("30");
  });

  it("applies the filters together, with the number of cars they find", async () => {
    const user = userEvent.setup();
    const queries = listingsApi();
    const router = renderApp("/cars");

    expect(await screen.findByRole("heading", { level: 1, name: "All cars" })).toBeInTheDocument();
    await user.selectOptions(filters().getByLabelText("Make"), await filters().findByRole("option", { name: "VOLKSWAGEN" }));
    await user.selectOptions(filters().getByLabelText("City"), await filters().findByRole("option", { name: "Casablanca" }));
    await user.type(filters().getByLabelText("From"), "80 000");
    await user.click(await filters().findByRole("checkbox", { name: "Apple CarPlay" }));

    // Nothing changes until the filters are applied.
    expect(router.state.location.search).toBe("");
    await user.click(await filters().findByRole("button", { name: "Show 5 cars" }));

    expect(router.state.location.search).toBe("?makeId=482&cityId=1&minPrice=80000&equipmentIds=30");
    expect(await screen.findByRole("heading", { level: 1, name: "VOLKSWAGEN in Casablanca" })).toBeInTheDocument();
    expect(queries.at(-1)?.get("equipmentIds")).toBe("30");
  });

  it("refuses a minimum price above the maximum", async () => {
    const user = userEvent.setup();
    listingsApi();
    const router = renderApp("/cars");

    await user.type(await filters().findByLabelText("From"), "300000");
    await user.type(filters().getByLabelText("To"), "80000");
    await user.click(filters().getByRole("button", { name: /^Show/u }));

    expect(filters().getByLabelText("To")).toHaveAccessibleDescription("Enter a maximum price above the minimum.");
    expect(router.state.location.search).toBe("");
  });

  it("removes one filter, or all of them", async () => {
    const user = userEvent.setup();
    listingsApi();
    const router = renderApp("/cars?makeId=482&cityId=1&sort=price_asc");

    await user.click(await screen.findByRole("button", { name: "Remove the filter VOLKSWAGEN" }));
    expect(router.state.location.search).toBe("?cityId=1&sort=price_asc");

    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(router.state.location.search).toBe("?sort=price_asc");
    expect(screen.queryByRole("list", { name: "Filters in use" })).not.toBeInTheDocument();
  });

  it("charts how prices spread for the other filters", async () => {
    const queries = listingsApi();
    renderApp("/cars?makeId=482");

    // One count for each bar, for the same make.
    await waitFor(() => {
      const bars = queries.filter((query) => query.get("limit") === "1" && query.get("makeId") === "482");
      expect(bars.some((query) => query.get("minPrice") === "30000" && query.get("maxPrice") === "59999")).toBe(true);
      expect(bars.some((query) => query.get("minPrice") === "800000" && !query.has("maxPrice"))).toBe(true);
    });
  });

  it("sets the price boxes from the slider", async () => {
    const user = userEvent.setup();
    listingsApi();
    const router = renderApp("/cars");

    const minimum = await filters().findByRole("slider", { name: "Minimum price" });
    // userEvent can't drag a slider, so the change is fired directly.
    fireEvent.change(minimum, { target: { value: "3" } });
    fireEvent.change(filters().getByRole("slider", { name: "Maximum price" }), { target: { value: "9" } });

    expect(filters().getByLabelText("From")).toHaveValue("90000");
    expect(filters().getByLabelText("To")).toHaveValue("300000");
    expect(minimum).toHaveAttribute("aria-valuetext", expect.stringMatching(/^90.000 MAD$/u));
    await user.click(await filters().findByRole("button", { name: "Show 5 cars" }));
    expect(router.state.location.search).toBe("?minPrice=90000&maxPrice=300000");
  });

  it("picks equipment from the full list", async () => {
    const user = userEvent.setup();
    listingsApi();
    const router = renderApp("/cars");

    await user.click(await filters().findByRole("button", { name: "Browse all 3 items" }));
    const dialog = within(screen.getByRole("dialog", { name: "Equipment" }));
    await user.click(dialog.getByRole("button", { name: /Safety/u }));
    await user.click(dialog.getByRole("checkbox", { name: "ESP" }));
    expect(dialog.getByRole("button", { name: "Remove the filter ESP" })).toBeInTheDocument();
    await user.click(await dialog.findByRole("button", { name: "Show 5 cars" }));

    expect(router.state.location.search).toBe("?equipmentIds=2");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the filters in a sheet on small screens", async () => {
    const user = userEvent.setup();
    listingsApi();
    const router = renderApp("/cars?cityId=1");

    await user.click(await screen.findByRole("button", { name: /^Filters/u }));
    const sheet = within(screen.getByRole("dialog", { name: "Filters" }));
    await user.selectOptions(sheet.getByLabelText("Make"), await sheet.findByRole("option", { name: "KIA" }));
    await user.click(await sheet.findByRole("button", { name: "Show 5 cars" }));

    expect(router.state.location.search).toBe("?makeId=499&cityId=1");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("offers to clear a search that finds nothing", async () => {
    const user = userEvent.setup();
    const router = renderApp("/cars?cityId=2");

    expect(await screen.findByText("No cars match your search.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear the search" }));
    expect(router.state.location.search).toBe("");
  });
});
