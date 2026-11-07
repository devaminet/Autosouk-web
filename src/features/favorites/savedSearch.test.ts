import { describe, expect, it } from "vitest";
import { readSavedSearch, writeSavedSearch } from "./savedSearch";

describe("saved search", () => {
  it("reads the address, ignoring values the API would refuse", () => {
    expect(readSavedSearch(new URLSearchParams("inspected=yes&sort=cheap&page=-2"))).toEqual({
      inspected: undefined,
      sort: "recent",
      page: 1,
    });
    expect(readSavedSearch(new URLSearchParams("inspected=false&sort=price_asc&page=3"))).toEqual({
      inspected: false,
      sort: "price_asc",
      page: 3,
    });
  });

  it("leaves the defaults out of the address", () => {
    expect(writeSavedSearch({ sort: "recent", page: 1 }).toString()).toBe("");
    expect(writeSavedSearch({ inspected: true, sort: "price_desc", page: 2 }).toString()).toBe(
      "inspected=true&sort=price_desc&page=2",
    );
  });
});
