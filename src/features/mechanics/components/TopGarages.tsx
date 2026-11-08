import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { formatNumber } from "../../../lib/format";
import { mechanicPath } from "../../../lib/paths";
import type { RankedGarage } from "../api";
import { GarageAvatar } from "./GarageAvatar";
import { GarageRating } from "./GarageRating";

type TopGaragesProps = {
  // The first three garages, best first.
  garages: RankedGarage[];
};

// The first garage stands in the middle and highest, the second on its
// start side and the third on its end side.
const places = [
  { order: "order-2", block: "bg-night bg-zellige py-64 text-surface", price: "text-subtle" },
  { order: "order-1", block: "bg-brand-soft py-40 text-ink", price: "text-muted" },
  { order: "order-3", block: "bg-saffron-soft py-32 text-ink", price: "text-muted" },
] as const;

// The podium of the three best rated garages, for wide screens.
export function TopGarages({ garages }: TopGaragesProps) {
  const { t } = useTranslation(["mechanics", "listings"]);

  return (
    <ol
      aria-label={t("rankings.podium")}
      className="flex items-end justify-center gap-16 overflow-hidden rounded-2xl border border-line bg-surface px-32 pt-32"
    >
      {garages.slice(0, places.length).map((garage, index) => {
        const place = places[index];
        if (!place) {
          return null;
        }
        return (
          <li className={`relative flex w-1/3 min-w-0 flex-col items-center gap-12 ${place.order}`} key={garage.mechanicId}>
            <GarageAvatar isTop={index === 0} logo={garage.profileImageLink} name={garage.name} size="l" />
            <h3 className="max-w-full truncate text-center type-h5 text-ink" dir="auto">
              <Link className="rounded-xs hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand after:absolute after:inset-0" to={mechanicPath(garage.mechanicId)}>
                {garage.name}
              </Link>
            </h3>
            <GarageRating count={garage.reviewCount} rating={garage.averageRating} />
            <div className={`flex w-full flex-col items-center gap-4 rounded-t-xl ${place.block}`}>
              <span className="type-display-l">
                <span className="sr-only">{t("rankings.rank")} </span>
                <bdi dir="ltr">{formatNumber(index + 1)}</bdi>
              </span>
              <span className={`type-mono-s ${place.price}`}>
                {garage.inspectionPrice === null ? (
                  t("rankings.priceAtGarage")
                ) : (
                  <>
                    <bdi dir="ltr">{formatNumber(garage.inspectionPrice)}</bdi> {t("listings:units.mad")}
                  </>
                )}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
