import type { CarMedia } from "../features/listings/api";

// A draft as GET /api/listings/{id} returns it to its seller.
export const testDraft = {
  id: 7,
  title: "My Golf",
  description: "Clean car",
  status: "draft",
  car: null,
};

export const testCar = {
  id: 70,
  makeId: 482,
  modelId: 10,
  cityId: 1,
  carburantId: 1,
  originId: 1,
  stateId: 2,
  price: 265000,
  year: 2020,
  distance: "54000",
  doorsNumber: 5,
  fiscalPower: 8,
  transmission: "automatic",
  ownersCount: 1,
  make: { name: "VOLKSWAGEN" },
  model: { name: "Golf" },
  city: { name: "Casablanca", slug: "casablanca" },
  equipment: [{ id: 1 }],
  carMedias: [] as CarMedia[],
};

export const testMedia = (id: number, changes: Partial<CarMedia> = {}): CarMedia => ({
  id,
  type: "image",
  link: `http://storage.test/cars/car-${id}.jpg`,
  isPrimary: false,
  ...changes,
});
