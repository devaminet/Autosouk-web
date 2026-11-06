// The price slider's stops, in MAD. Cheaper cars are more common, so the
// stops are closer together at the low end. A thumb past the last stop means
// no maximum, and on the first stop no minimum.
export const priceStops = [
  0, 30_000, 60_000, 90_000, 120_000, 150_000, 180_000, 210_000, 250_000, 300_000, 350_000, 400_000,
  500_000, 650_000, 800_000,
];

// The thumb position for "no maximum".
export const lastStop = priceStops.length;

// One bar of the histogram for each gap between stops, and one past the last.
// The API's price bounds include both ends, so each bar stops just before the next.
export const priceBuckets = priceStops.map((min, index) => {
  const next = priceStops[index + 1];
  return { min: min === 0 ? undefined : min, max: next === undefined ? undefined : next - 1 };
});

// The stop at or below a minimum price.
export const minStop = (price: number | undefined): number => {
  if (price === undefined) {
    return 0;
  }
  const index = priceStops.findLastIndex((stop) => stop <= price);
  return Math.max(index, 0);
};

// The stop at or above a maximum price.
export const maxStop = (price: number | undefined): number => {
  if (price === undefined) {
    return lastStop;
  }
  const index = priceStops.findIndex((stop) => stop >= price);
  return index === -1 ? lastStop : index;
};

// The price of a stop, or none at either end.
export const stopPrice = (index: number): number | undefined =>
  index <= 0 || index >= lastStop ? undefined : priceStops[index];
