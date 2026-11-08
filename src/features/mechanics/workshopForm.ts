import type { Mechanic, WorkshopDetails } from "./api";
import type { LatLng } from "./components/WorkshopMap";

// The form keeps what the inputs hold, as text.
export type WorkshopFormValues = {
  name: string;
  phone: string;
  price: string;
  description: string;
  cityId: string;
  address: string;
  position: LatLng | null;
};

export const workshopFormFrom = (mechanic: Mechanic | null, userCityId: number | null): WorkshopFormValues => ({
  name: mechanic?.name ?? "",
  phone: mechanic?.phone ?? "",
  price: mechanic?.inspectionPrice?.toString() ?? "",
  description: mechanic?.description ?? "",
  cityId: String(mechanic?.cityId ?? userCityId ?? ""),
  address: mechanic?.address ?? "",
  position: mechanic ? { lat: mechanic.latitude, lng: mechanic.longitude } : null,
});

const orNull = (value: string) => value.trim() || null;

// What the API receives. It checks the details, such as a missing pin.
export const workshopDetails = (values: WorkshopFormValues): WorkshopDetails => ({
  name: values.name.trim(),
  phone: orNull(values.phone),
  inspectionPrice: values.price === "" ? null : Number(values.price),
  description: orNull(values.description),
  cityId: values.cityId === "" ? null : Number(values.cityId),
  address: values.address.trim(),
  latitude: values.position?.lat ?? null,
  longitude: values.position?.lng ?? null,
});

export const digitsOnly = (value: string) => value.replace(/\D/gu, "");

// The first letters of the name's first two words, as in "GA" for Garage Atlas.
export const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
