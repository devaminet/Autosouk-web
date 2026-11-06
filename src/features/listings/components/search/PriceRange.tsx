import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatCompact, formatNumber } from "../../../../lib/format";
import { lastStop, maxStop, minStop, stopPrice } from "../../priceRange";

type PriceRangeProps = {
  minPrice?: number;
  maxPrice?: number;
  // Called by the slider, with a price from its stops.
  onChange: (minPrice: number | undefined, maxPrice: number | undefined) => void;
  // How many cars each bar holds. Without it, the bars wait at their lowest.
  counts?: number[];
  showHistogram: boolean;
  // The exact price boxes, below the slider.
  children?: ReactNode;
};

// The lowest a bar with cars gets, so a single car still shows. A bar with no
// cars is a flat line, so it doesn't look like a price band with cars.
const minBar = 8;
const emptyBar = 2;

// A price range: its summary, how prices spread for the other filters, and a
// slider with a thumb for each end.
export function PriceRange({ minPrice, maxPrice, onChange, counts, showHistogram, children }: PriceRangeProps) {
  const { t, i18n } = useTranslation("listings");
  const low = minStop(minPrice);
  const high = Math.max(maxStop(maxPrice), low + 1);
  const most = Math.max(0, ...(counts ?? []));
  // Arabic words such as "80 ألف" read right to left, so the direction follows the text.
  const compact = (value: number) => <bdi>{formatCompact(value, i18n.language)}</bdi>;
  const valueText = (price: number | undefined, none: string) =>
    price === undefined ? none : `${formatNumber(price)} ${t("units.mad")}`;

  const summary = () => {
    if (minPrice !== undefined && maxPrice !== undefined) {
      return (
        <>
          {compact(minPrice)} – {compact(maxPrice)}
        </>
      );
    }
    if (minPrice !== undefined) {
      return (
        <>
          {t("search.active.from")} {compact(minPrice)}
        </>
      );
    }
    if (maxPrice !== undefined) {
      return (
        <>
          {t("search.active.upTo")} {compact(maxPrice)}
        </>
      );
    }
    return t("search.filters.anyPrice");
  };

  return (
    <fieldset className="flex flex-col gap-12">
      <div className="flex items-baseline justify-between gap-8">
        <legend className="type-label-m text-ink">{t("search.filters.price")}</legend>
        <span className="type-mono-s text-muted">{summary()}</span>
      </div>
      {showHistogram && (
        <div aria-hidden="true" className="flex h-48 items-end gap-2">
          {Array.from({ length: lastStop }, (_, index) => {
            const count = counts?.[index] ?? 0;
            // Each bar is its share of the fullest bar.
            const height = count === 0 ? emptyBar : Math.max(minBar, (count / most) * 100);
            const inside = index >= low && index < high && count > 0;
            return (
              <span
                className={`flex-1 rounded-xs ${inside ? "bg-brand" : "bg-line"}`}
                key={index}
                // The height is the share of cars, so it can't be a class.
                style={{ blockSize: `${height}%` }}
              />
            );
          })}
        </div>
      )}
      <div className="relative h-20">
        <div className="absolute inset-s-8 inset-e-8 top-8 h-4 rounded-full bg-line">
          {/* The chosen part of the track, between the thumbs. */}
          <div
            className="absolute inset-y-0 rounded-full bg-brand"
            style={{
              insetInlineStart: `${(low / lastStop) * 100}%`,
              insetInlineEnd: `${((lastStop - high) / lastStop) * 100}%`,
            }}
          />
        </div>
        <input
          aria-label={t("search.filters.minThumb")}
          aria-valuetext={valueText(stopPrice(low), t("search.filters.noMin"))}
          className="range-thumbs absolute inset-0 m-0 h-20 w-full"
          max={lastStop}
          min={0}
          onChange={(event) => {
            const next = Math.min(Number(event.target.value), high - 1);
            onChange(stopPrice(next), maxPrice);
          }}
          step={1}
          type="range"
          value={low}
        />
        <input
          aria-label={t("search.filters.maxThumb")}
          aria-valuetext={valueText(stopPrice(high), t("explore.search.noLimit"))}
          className="range-thumbs absolute inset-0 m-0 h-20 w-full"
          max={lastStop}
          min={0}
          onChange={(event) => {
            const next = Math.max(Number(event.target.value), low + 1);
            onChange(minPrice, stopPrice(next));
          }}
          step={1}
          type="range"
          value={high}
        />
      </div>
      {children}
    </fieldset>
  );
}
