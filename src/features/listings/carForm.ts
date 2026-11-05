import { fieldError } from "../../lib/api/errors";
import { transmissions } from "./api";
import type { CarInput, ListingCar, Transmission } from "./api";

// Inputs hold text. toCarInput turns it into what the API expects.
export type CarFormValues = {
  makeId: string;
  modelId: string;
  year: string;
  price: string;
  distance: string;
  cityId: string;
  carburantId: string;
  transmission: string;
  doorsNumber: string;
  fiscalPower: string;
  ownersCount: string;
  originId: string;
  stateId: string;
  equipmentIds: number[];
};

export const carFields = [
  "makeId",
  "modelId",
  "year",
  "price",
  "distance",
  "cityId",
  "carburantId",
  "transmission",
  "doorsNumber",
  "fiscalPower",
  "ownersCount",
  "originId",
  "stateId",
  "equipmentIds",
] as const;

export type CarField = (typeof carFields)[number];

// POST names a field "price"; PATCH nests it as "car.price".
export const carErrorFields = carFields.flatMap((field) => [field, `car.${field}`]);

export const carFieldError = (error: unknown, field: CarField): string | undefined =>
  fieldError(error, field) ?? fieldError(error, `car.${field}`);

export const emptyCarForm: CarFormValues = {
  makeId: "",
  modelId: "",
  year: "",
  price: "",
  distance: "",
  cityId: "",
  carburantId: "",
  transmission: "",
  doorsNumber: "",
  fiscalPower: "",
  ownersCount: "0",
  originId: "",
  stateId: "",
  equipmentIds: [],
};

export const carFormFrom = (car: ListingCar): CarFormValues => ({
  makeId: String(car.makeId),
  modelId: String(car.modelId),
  year: String(car.year),
  price: String(car.price),
  distance: car.distance,
  cityId: String(car.cityId),
  carburantId: String(car.carburantId),
  transmission: car.transmission,
  doorsNumber: String(car.doorsNumber),
  fiscalPower: String(car.fiscalPower),
  ownersCount: String(car.ownersCount),
  originId: String(car.originId),
  stateId: String(car.stateId),
  equipmentIds: car.equipment.map(({ id }) => id),
});

// Keeps only digits, for amounts typed with spaces or separators.
export const digitsOnly = (value: string): string => value.replace(/\D/gu, "");

const toNumber = (value: string) => (value === "" ? undefined : Number(value));

const isTransmission = (value: string): value is Transmission =>
  transmissions.some((transmission) => transmission === value);

export const toCarInput = (values: CarFormValues): CarInput => ({
  makeId: toNumber(values.makeId),
  modelId: toNumber(values.modelId),
  year: toNumber(values.year),
  price: toNumber(values.price),
  distance: values.distance === "" ? undefined : values.distance,
  cityId: toNumber(values.cityId),
  carburantId: toNumber(values.carburantId),
  transmission: isTransmission(values.transmission) ? values.transmission : undefined,
  doorsNumber: toNumber(values.doorsNumber),
  fiscalPower: toNumber(values.fiscalPower),
  ownersCount: toNumber(values.ownersCount),
  originId: toNumber(values.originId),
  stateId: toNumber(values.stateId),
  equipmentIds: values.equipmentIds,
});
