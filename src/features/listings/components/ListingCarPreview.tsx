import { useTranslation } from "react-i18next";
import { formatNumber } from "../../../lib/format";
import type { ListingCar } from "../api";
import { useLookups } from "../hooks";
import { CarPreview } from "./CarPreview";

type ListingCarPreviewProps = {
  car: ListingCar;
};

// The preview of a saved car, with its cover photo.
export function ListingCarPreview({ car }: ListingCarPreviewProps) {
  const { t } = useTranslation(["listings", "enums"]);
  const lookups = useLookups();
  const fuel = lookups.data?.carburants.find(({ id }) => id === car.carburantId);
  const cover = car.carMedias.find(({ isPrimary, type }) => isPrimary && type === "image");

  return (
    <CarPreview
      city={t(`enums:city.${car.city.slug}`, { defaultValue: car.city.name })}
      details={[
        String(car.year),
        `${formatNumber(Number(car.distance))} ${t("units.km")}`,
        fuel && t(`enums:carburant.${fuel.slug}`),
        t(`enums:transmission.${car.transmission}`),
      ].filter((detail): detail is string => Boolean(detail))}
      image={cover?.link}
      mediaCount={car.carMedias.length}
      price={car.price}
      title={`${car.make.name} ${car.model.name}`}
    />
  );
}
