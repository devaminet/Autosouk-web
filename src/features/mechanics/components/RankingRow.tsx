import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { formatNumber } from "../../../lib/format";
import { mechanicPath } from "../../../lib/paths";
import type { RankedGarage } from "../api";
import { GarageAvatar } from "./GarageAvatar";
import { GarageRating } from "./GarageRating";

type RankingRowProps = {
  garage: RankedGarage;
  rank: number;
  // The city's name, translated, which is also the garage's.
  city: string;
};

// One garage of the rankings: its rank, name, address, rating and price.
export function RankingRow({ garage, rank, city }: RankingRowProps) {
  const { t } = useTranslation(["mechanics", "listings"]);

  return (
    <article className="relative flex items-center gap-12 py-16 md:gap-16">
      <span className="w-24 shrink-0 text-center type-h3 text-muted">
        <span className="sr-only">{t("rankings.rank")} </span>
        <bdi dir="ltr">{formatNumber(rank)}</bdi>
      </span>
      <GarageAvatar logo={garage.profileImageLink} name={garage.name} size="m" />
      <div className="flex min-w-0 flex-1 flex-col gap-4 md:flex-row md:items-center md:gap-16">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h3 className="truncate type-h5 text-ink" dir="auto">
            {/* The whole row opens the profile. */}
            <Link className="rounded-xs hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand after:absolute after:inset-0" to={mechanicPath(garage.mechanicId)}>
              {garage.name}
            </Link>
          </h3>
          <p className="hidden truncate type-body-s text-muted md:block" dir="auto">
            {garage.address}, {city}
          </p>
        </div>
        <GarageRating count={garage.reviewCount} long rating={garage.averageRating} />
      </div>
      <p className="flex shrink-0 flex-col items-end text-end">
        {garage.inspectionPrice === null ? (
          <span className="type-body-s text-muted">{t("rankings.priceAtGarage")}</span>
        ) : (
          <>
            <span className="type-h5 whitespace-nowrap text-ink">
              <bdi dir="ltr">{formatNumber(garage.inspectionPrice)}</bdi> {t("listings:units.mad")}
            </span>
            <span className="hidden type-body-xs text-muted md:block">{t("rankings.inspection")}</span>
          </>
        )}
      </p>
      <span
        aria-hidden="true"
        className="hidden min-h-control-s items-center rounded-full px-16 type-label-m text-ink ring-1 ring-line-strong ring-inset md:flex"
      >
        {t("rankings.view")}
      </span>
    </article>
  );
}
