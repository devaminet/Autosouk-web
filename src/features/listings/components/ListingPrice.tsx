import { useTranslation } from "react-i18next";
import { formatNumber } from "../../../lib/format";
import type { SellerListing } from "../api";

type ListingPriceProps = {
  car: SellerListing["car"];
};

export function ListingPrice({ car }: ListingPriceProps) {
  const { t } = useTranslation("listings");

  if (!car) {
    return <span className="type-body-m text-muted">—</span>;
  }
  return (
    <span className="whitespace-nowrap">
      <bdi className="type-price-m text-ink" dir="ltr">
        {formatNumber(car.price)}
      </bdi>{" "}
      <span className="type-mono-s text-muted">{t("units.mad")}</span>
    </span>
  );
}
