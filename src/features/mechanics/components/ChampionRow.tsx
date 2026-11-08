import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { formatNumber } from "../../../lib/format";
import { mechanicPath } from "../../../lib/paths";
import type { RankedGarage } from "../api";
import { GarageRating } from "./GarageRating";

type ChampionRowProps = {
  garage: RankedGarage;
};

// The best rated garage, on its own night banner on small screens.
export function ChampionRow({ garage }: ChampionRowProps) {
  const { t } = useTranslation(["mechanics", "listings"]);

  return (
    <article className="relative flex items-center gap-16 rounded-xl bg-night bg-zellige px-16 py-20 text-surface">
      <span className="type-display-m text-saffron">
        <span className="sr-only">{t("rankings.rank")} </span>
        <bdi dir="ltr">{formatNumber(1)}</bdi>
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <h3 className="truncate type-h4" dir="auto">
          <Link className="rounded-xs hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron after:absolute after:inset-0" to={mechanicPath(garage.mechanicId)}>
            {garage.name}
          </Link>
        </h3>
        <GarageRating count={garage.reviewCount} onNight rating={garage.averageRating} />
      </div>
      <p className="shrink-0 type-h4 whitespace-nowrap">
        {garage.inspectionPrice === null ? (
          <span className="type-body-s text-subtle">{t("rankings.priceAtGarage")}</span>
        ) : (
          <>
            <bdi dir="ltr">{formatNumber(garage.inspectionPrice)}</bdi>{" "}
            <span className="type-body-s">{t("listings:units.mad")}</span>
          </>
        )}
      </p>
    </article>
  );
}
