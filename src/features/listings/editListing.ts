import type { CarChanges, ListingCar, ListingChanges } from "./api";

// What the edit drawer changes. Inputs hold text, like the car form.
export type EditFormValues = {
  title: string;
  description: string;
  price: string;
  distance: string;
  cityId: string;
  stateId: string;
  equipmentIds: number[];
};

export const editFormFrom = (listing: {
  title: string;
  description: string;
  car: ListingCar | null;
}): EditFormValues => ({
  title: listing.title,
  description: listing.description,
  price: listing.car ? String(listing.car.price) : "",
  distance: listing.car?.distance ?? "",
  cityId: listing.car ? String(listing.car.cityId) : "",
  stateId: listing.car ? String(listing.car.stateId) : "",
  equipmentIds: listing.car?.equipment.map(({ id }) => id) ?? [],
});

const sameIds = (a: number[], b: number[]) => {
  const set = new Set(a);
  return a.length === b.length && b.every((id) => set.has(id));
};

// Only what changed is sent, since any saved change sends the listing back
// to review. Null means nothing changed.
export const listingChanges = (
  initial: EditFormValues,
  values: EditFormValues,
  hasCar: boolean,
): ListingChanges | null => {
  const changes: ListingChanges = {};
  if (values.title !== initial.title) {
    changes.title = values.title;
  }
  if (values.description !== initial.description) {
    changes.description = values.description;
  }
  if (hasCar) {
    const car: CarChanges = {};
    if (values.price !== initial.price) {
      car.price = values.price === "" ? null : Number(values.price);
    }
    if (values.distance !== initial.distance) {
      car.distance = values.distance;
    }
    if (values.cityId !== initial.cityId) {
      car.cityId = Number(values.cityId);
    }
    if (values.stateId !== initial.stateId) {
      car.stateId = Number(values.stateId);
    }
    if (!sameIds(values.equipmentIds, initial.equipmentIds)) {
      car.equipmentIds = values.equipmentIds;
    }
    if (Object.keys(car).length > 0) {
      changes.car = car;
    }
  }
  return Object.keys(changes).length > 0 ? changes : null;
};
