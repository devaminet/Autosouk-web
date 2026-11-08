import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import { formatNumber } from "../../../lib/format";
import type { RatingSummary } from "../api";
import { GarageRating } from "./GarageRating";

type RatingBreakdownProps = {
  rating: RatingSummary;
};

const starCounts = [5, 4, 3, 2, 1] as const;

// The average rating, and how many reviews give each number of stars.
export function RatingBreakdown({ rating }: RatingBreakdownProps) {
  const { t } = useTranslation("mechanics");
  const most = Math.max(1, ...starCounts.map((stars) => rating.distribution[stars]));

  // Without reviews, there is nothing to break down.
  if (rating.average === null) {
    return <GarageRating count={rating.count} rating={null} />;
  }

  return (
    <div className="flex flex-col gap-16">
      <p className="flex items-baseline gap-8">
        <bdi className="type-display-l text-ink" dir="ltr">
          {rating.average.toFixed(1)}
        </bdi>
        <span className="type-h4 text-muted">
          / <bdi dir="ltr">5</bdi>
        </span>
      </p>
      <GarageRating count={rating.count} long rating={rating.average} />
      <dl className="flex flex-col gap-8">
        {starCounts.map((stars) => {
          const count = rating.distribution[stars];
          return (
            <div className="flex items-center gap-8 type-label-s text-ink" key={stars}>
              <dt className="flex w-32 shrink-0 items-center gap-4">
                <bdi dir="ltr">{stars}</bdi>
                <Icon className="fill-current text-saffron" name="star" size={12} />
                <span className="sr-only">{t("profile.stars", { count: stars })}</span>
              </dt>
              <dd className="flex flex-1 items-center gap-8">
                <span aria-hidden="true" className="h-4 flex-1 overflow-hidden rounded-full bg-line">
                  <span
                    className="block h-full rounded-full bg-saffron"
                    // The share of the busiest star count, so the longest bar fills the track.
                    style={{ inlineSize: `${(count / most) * 100}%` }}
                  />
                </span>
                <bdi className="w-32 shrink-0 text-end type-mono-s text-muted" dir="ltr">
                  {formatNumber(count)}
                </bdi>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
