import { describe, expect, it } from "vitest";
import { readExploreSearch, writeExploreSearch } from "./exploreSearch";

describe("explore search", () => {
  it("reads the address, ignoring values the API would refuse", () => {
    expect(
      readExploreSearch(new URLSearchParams("makeId=482&modelId=10&cityId=x&maxPrice=-5&sort=cheap&page=0")),
    ).toEqual({
      makeId: 482,
      modelId: 10,
      cityId: undefined,
      maxPrice: undefined,
      sort: "newest",
      page: 1,
    });
  });

  it("drops a model without its make", () => {
    expect(readExploreSearch(new URLSearchParams("modelId=10")).modelId).toBeUndefined();
  });

  it("leaves the defaults out of the address", () => {
    expect(writeExploreSearch({ cityId: 1, sort: "newest", page: 1 }).toString()).toBe("cityId=1");
    expect(writeExploreSearch({ sort: "price_asc", page: 2 }).toString()).toBe("sort=price_asc&page=2");
  });
});
