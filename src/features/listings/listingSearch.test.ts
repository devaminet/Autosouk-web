import { describe, expect, it } from "vitest";
import { hasFilters, readListingSearch, toListingsFilter, writeListingSearch } from "./listingSearch";

describe("listing search", () => {
  it("reads the address, ignoring values the API would refuse", () => {
    expect(
      readListingSearch(
        new URLSearchParams(
          "makeId=482&modelId=10&cityId=x&minPrice=80000&maxPrice=-5&equipmentIds=7,3,x,7&sort=cheap&page=0",
        ),
      ),
    ).toEqual({
      makeId: 482,
      modelId: 10,
      cityId: undefined,
      minPrice: 80_000,
      maxPrice: undefined,
      equipmentIds: [3, 7],
      sort: "newest",
      page: 1,
    });
  });

  it("drops a model without its make", () => {
    expect(readListingSearch(new URLSearchParams("modelId=10")).modelId).toBeUndefined();
  });

  it("leaves the defaults out of the address", () => {
    expect(writeListingSearch({ cityId: 1, equipmentIds: [], sort: "newest", page: 1 }).toString()).toBe(
      "cityId=1",
    );
    expect(writeListingSearch({ equipmentIds: [], sort: "price_asc", page: 2 }).toString()).toBe(
      "sort=price_asc&page=2",
    );
  });

  it("writes the equipment as one sorted list", () => {
    const params = writeListingSearch({ equipmentIds: [9, 2, 9], sort: "newest", page: 1 });
    expect(params.get("equipmentIds")).toBe("2,9");
    expect(readListingSearch(params).equipmentIds).toEqual([2, 9]);
  });

  it("counts equipment and a minimum price as filters", () => {
    expect(hasFilters({ equipmentIds: [], sort: "newest", page: 1 })).toBe(false);
    expect(hasFilters({ equipmentIds: [2], sort: "newest", page: 1 })).toBe(true);
    expect(hasFilters({ minPrice: 1, equipmentIds: [], sort: "newest", page: 1 })).toBe(true);
  });

  it("leaves an empty equipment list out of the API filter", () => {
    expect(toListingsFilter({ equipmentIds: [], sort: "newest", page: 1 }, 9)).toEqual({
      equipmentIds: undefined,
      sort: "newest",
      page: 1,
      limit: 9,
    });
  });
});
