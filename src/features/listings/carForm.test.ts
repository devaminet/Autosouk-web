import { describe, expect, it } from "vitest";
import { digitsOnly, emptyCarForm, toCarInput } from "./carForm";

describe("toCarInput", () => {
  it("turns text into numbers and leaves empty inputs out", () => {
    const input = toCarInput({
      ...emptyCarForm,
      makeId: "482",
      price: "265000",
      distance: "54000",
      transmission: "automatic",
      equipmentIds: [1, 2],
    });

    expect(input).toEqual({
      makeId: 482,
      price: 265000,
      distance: "54000",
      transmission: "automatic",
      ownersCount: 0,
      equipmentIds: [1, 2],
    });
    expect(JSON.parse(JSON.stringify(input))).not.toHaveProperty("modelId");
  });

  it("ignores a transmission the API does not know", () => {
    expect(toCarInput({ ...emptyCarForm, transmission: "cvt" }).transmission).toBeUndefined();
  });
});

describe("digitsOnly", () => {
  it("removes spaces and separators", () => {
    expect(digitsOnly("265 000 MAD")).toBe("265000");
  });
});
