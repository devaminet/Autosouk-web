import type { LatLng } from "./components/WorkshopMap";

// A city's centre and how far it reaches, as the API checks a workshop's pin.
export type CityArea = LatLng & { radiusKm: number };

export type CityChoice = { id: number; label: string; area: CityArea | null };

const earthRadiusKm = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

// The great-circle distance, as the API computes it.
export const distanceKm = (from: LatLng, to: LatLng) => {
  const latitudeDelta = toRadians(to.lat - from.lat);
  const longitudeDelta = toRadians(to.lng - from.lng);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
};

export const isInArea = (area: CityArea, position: LatLng) => distanceKm(area, position) <= area.radiusKm;

// The city a pin belongs to. Areas of nearby cities can overlap, so the
// chosen city wins when it contains the pin; otherwise the city whose centre
// is closest, relative to its size. Null when no city contains it.
export const cityOfPin = (cities: CityChoice[], position: LatLng, chosenId: number | null) => {
  const containing = cities.filter(({ area }) => area !== null && isInArea(area, position));
  const chosen = containing.find(({ id }) => id === chosenId);
  if (chosen) {
    return chosen;
  }
  const closeness = ({ area }: CityChoice) => (area ? distanceKm(area, position) / area.radiusKm : Infinity);
  return containing.toSorted((a, b) => closeness(a) - closeness(b))[0] ?? null;
};

// Shows the whole city in the map's height.
export const zoomForArea = ({ radiusKm }: CityArea) => Math.min(14, Math.max(9, Math.floor(15.2 - Math.log2(radiusKm))));
