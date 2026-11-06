import { describe, expect, it } from "vitest";
import { lastStop, maxStop, minStop, priceBuckets, stopPrice } from "./priceRange";

describe("price range", () => {
  it("places prices on the slider's stops", () => {
    expect(minStop(undefined)).toBe(0);
    expect(minStop(80_000)).toBe(2);
    expect(minStop(90_000)).toBe(3);
    expect(maxStop(undefined)).toBe(lastStop);
    expect(maxStop(280_000)).toBe(9);
    expect(maxStop(2_000_000)).toBe(lastStop);
  });

  it("has no price at either end", () => {
    expect(stopPrice(0)).toBeUndefined();
    expect(stopPrice(lastStop)).toBeUndefined();
    expect(stopPrice(9)).toBe(300_000);
  });

  it("splits prices into bars that don't overlap", () => {
    expect(priceBuckets[0]).toEqual({ min: undefined, max: 29_999 });
    expect(priceBuckets[1]).toEqual({ min: 30_000, max: 59_999 });
    expect(priceBuckets.at(-1)).toEqual({ min: 800_000, max: undefined });
  });
});
