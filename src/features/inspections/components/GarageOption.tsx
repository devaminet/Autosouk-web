import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import { formatNumber } from "../../../lib/format";
import type { Garage } from "../api";

type GarageOptionProps = {
  garage: Garage;
  // The radio group's name.
  name: string;
  checked: boolean;
  onChoose: () => void;
  // The car's city, translated, which is also the garage's.
  city: string;
};

const stars = [1, 2, 3, 4, 5];

// The first letters of the garage's first two words, as in "GA" for Garage Atlas.
const initials = (name: string) =>
  name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

// One garage to choose, with its rating and price.
export function GarageOption({ garage, name, checked, onChoose, city }: GarageOptionProps) {
  const { t } = useTranslation(["inspections", "listings"]);
  const rating = garage.averageRating;

  return (
    <label className="flex cursor-pointer items-center gap-12 rounded-xl bg-surface p-12 ring-1 ring-line ring-inset hover:bg-surface-2 has-checked:bg-brand-soft has-checked:ring-2 has-checked:ring-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand">
      <input
        checked={checked}
        className="size-20 shrink-0 cursor-pointer accent-brand"
        name={name}
        onChange={onChoose}
        type="radio"
        value={garage.mechanicId}
      />
      <span
        aria-hidden="true"
        className="flex size-40 shrink-0 items-center justify-center rounded-full bg-brand-soft type-label-m text-brand-ink"
        dir="auto"
      >
        {initials(garage.name)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="type-h5 text-ink" dir="auto">
          {garage.name}
        </span>
        <span className="truncate type-body-xs text-muted" dir="auto">
          {garage.address}, {city}
        </span>
        {rating === null ? (
          <span className="type-body-xs text-muted">{t("request.noReviews")}</span>
        ) : (
          <span className="flex items-center gap-4 type-label-s text-ink">
            <span aria-hidden="true" className="flex text-saffron">
              {stars.map((star) => (
                <Icon className={star <= Math.round(rating) ? "fill-current" : "text-line-strong"} key={star} name="star" size={14} />
              ))}
            </span>
            <span className="sr-only">
              {t("request.ratingLabel", { rating: rating.toFixed(1), count: garage.reviewCount })}
            </span>
            <span aria-hidden="true">
              <bdi dir="ltr">{rating.toFixed(1)}</bdi>{" "}
              <span className="text-muted">
                (<bdi dir="ltr">{formatNumber(garage.reviewCount)}</bdi>)
              </span>
            </span>
          </span>
        )}
      </span>
      <span className="flex shrink-0 flex-col items-end text-end">
        {garage.inspectionPrice === null ? (
          <span className="type-body-s text-muted">{t("request.priceAtGarage")}</span>
        ) : (
          <>
            <span className="type-h5 whitespace-nowrap text-ink">
              <bdi dir="ltr">{formatNumber(garage.inspectionPrice)}</bdi> {t("listings:units.mad")}
            </span>
            <span className="type-body-xs text-muted">{t("request.paidAtGarage")}</span>
          </>
        )}
      </span>
    </label>
  );
}
