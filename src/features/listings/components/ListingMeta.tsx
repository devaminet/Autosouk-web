import { useTranslation } from "react-i18next";
import { formatNumber } from "../../../lib/format";
import type { SellerListing } from "../api";

// The API stores distance as text, so only format it when it is a plain number.
const distanceLabel = (distance: string) =>
  /^\d+$/u.test(distance) ? formatNumber(Number(distance)) : distance;

type ListingMetaProps = {
  car: SellerListing["car"];
};

export function ListingMeta({ car }: ListingMetaProps) {
  const { t } = useTranslation("listings");

  if (!car) {
    return <p className="type-body-s text-muted">{t("myListings.noCar")}</p>;
  }
  return (
    <p className="type-body-s text-muted">
      <bdi dir="ltr">{car.year}</bdi> ·{" "}
      <bdi dir="ltr">{distanceLabel(car.distance)}</bdi> {t("units.km")}
    </p>
  );
}
