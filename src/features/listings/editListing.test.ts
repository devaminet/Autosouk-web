import { describe, expect, it } from "vitest";
import { editFormFrom, listingChanges } from "./editListing";
import type { EditFormValues } from "./editListing";

const initial: EditFormValues = {
  title: "Golf",
  description: "Clean",
  price: "265000",
  distance: "54000",
  cityId: "1",
  stateId: "2",
  equipmentIds: [1, 2],
};

describe("listingChanges", () => {
  it("is null when nothing changed, whatever the equipment order", () => {
    expect(listingChanges(initial, { ...initial, equipmentIds: [2, 1] }, true)).toBeNull();
  });

  it("keeps only the changed fields", () => {
    expect(
      listingChanges(initial, { ...initial, title: "Golf 8", price: "259000", equipmentIds: [1] }, true),
    ).toEqual({ title: "Golf 8", car: { price: 259000, equipmentIds: [1] } });
  });

  it("sends an emptied price as null, so the API names it", () => {
    expect(listingChanges(initial, { ...initial, price: "" }, true)).toEqual({ car: { price: null } });
  });

  it("leaves the car out when the listing has none", () => {
    expect(listingChanges(initial, { ...initial, title: "Golf 8", price: "1" }, false)).toEqual({
      title: "Golf 8",
    });
  });
});

describe("editFormFrom", () => {
  it("starts empty car fields for a listing without a car", () => {
    expect(editFormFrom({ title: "T", description: "D", car: null })).toEqual({
      title: "T",
      description: "D",
      price: "",
      distance: "",
      cityId: "",
      stateId: "",
      equipmentIds: [],
    });
  });
});
