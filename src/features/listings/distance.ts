import { formatNumber } from "../../lib/format";

// The API stores distance as text, so only format it when it is a plain number.
export const distanceLabel = (distance: string): string =>
  /^\d+$/u.test(distance) ? formatNumber(Number(distance)) : distance;
