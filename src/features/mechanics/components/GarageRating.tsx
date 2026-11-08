import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import { formatNumber } from "../../../lib/format";

type GarageRatingProps = {
  // From 1 to 5. Null without reviews.
  rating: number | null;
  count: number;
  // "(54 reviews)" instead of "(54)" on wider screens.
  long?: boolean;
  // Lighter text on night surfaces.
  onNight?: boolean;
};

const stars = [1, 2, 3, 4, 5];

// Five stars, the average and the number of reviews.
export function GarageRating({ rating, count, long = false, onNight = false }: GarageRatingProps) {
  const { t } = useTranslation("mechanics");
  const muted = onNight ? "text-subtle" : "text-muted";

  if (rating === null) {
    return <span className={`type-body-xs ${muted}`}>{t("rankings.noReviews")}</span>;
  }
  return (
    <span className={`flex items-center gap-4 type-label-s ${onNight ? "text-surface" : "text-ink"}`}>
      <span aria-hidden="true" className="flex text-saffron">
        {stars.map((star) => (
          <Icon
            className={star <= Math.round(rating) ? "fill-current" : onNight ? "text-subtle" : "text-line-strong"}
            key={star}
            name="star"
            size={14}
          />
        ))}
      </span>
      <span className="sr-only">{t("rankings.ratingLabel", { rating: rating.toFixed(1), count })}</span>
      <span aria-hidden="true">
        <bdi dir="ltr">{rating.toFixed(1)}</bdi>{" "}
        <span className={`type-body-xs ${muted}`}>
          <span className={long ? "md:hidden" : undefined}>
            (<bdi dir="ltr">{formatNumber(count)}</bdi>)
          </span>
          {long && (
            <span className="hidden md:inline">
              (<bdi dir="ltr">{formatNumber(count)}</bdi> {t("rankings.reviews", { count })})
            </span>
          )}
        </span>
      </span>
    </span>
  );
}
