import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { formatNumber } from "../../../lib/format";
import type { ListingCar, Lookups } from "../api";

type ListingSpecsProps = {
  car: ListingCar;
  lookups?: Lookups;
};

// The facts buyers compare first, in a card.
export function ListingSpecs({ car, lookups }: ListingSpecsProps) {
  const { t } = useTranslation(["listings", "enums"]);
  const slugOf = (items: { id: number; slug: string }[] | undefined, id: number) =>
    items?.find((item) => item.id === id)?.slug;
  const fuel = slugOf(lookups?.carburants, car.carburantId);
  const origin = slugOf(lookups?.origins, car.originId);
  const condition = slugOf(lookups?.states, car.stateId);
  const number = (value: number | string, unit: string) => (
    <>
      <bdi dir="ltr">{formatNumber(Number(value))}</bdi> {unit}
    </>
  );
  const specs: { icon: IconName; label: string; value: ReactNode }[] = [
    { icon: "calendar", label: t("carDetails.year"), value: <bdi dir="ltr">{car.year}</bdi> },
    { icon: "gauge", label: t("carDetails.mileage"), value: number(car.distance, t("units.km")) },
    { icon: "fuel", label: t("carDetails.fuel"), value: fuel ? t(`enums:carburant.${fuel}`) : "—" },
    { icon: "gearbox", label: t("carDetails.transmission"), value: t(`enums:transmission.${car.transmission}`) },
    { icon: "zap", label: t("carDetails.fiscalPower"), value: number(car.fiscalPower, t("units.cv")) },
    { icon: "door", label: t("carDetails.doors"), value: <bdi dir="ltr">{car.doorsNumber}</bdi> },
    { icon: "users", label: t("carDetails.owners"), value: <bdi dir="ltr">{car.ownersCount}</bdi> },
    { icon: "globe", label: t("carDetails.origin"), value: origin ? t(`enums:car_origin.${origin}`) : "—" },
    { icon: "award", label: t("carDetails.condition"), value: condition ? t(`enums:car_state.${condition}`) : "—" },
  ];

  return (
    <section className="flex flex-col gap-20 rounded-xl border border-line bg-surface p-20 md:p-24">
      <h2 className="type-h4 text-ink">{t("listing.specs")}</h2>
      <dl className="grid grid-cols-2 gap-16 lg:grid-cols-3">
        {specs.map(({ icon, label, value }) => (
          <div className="flex items-center gap-12" key={label}>
            <span className="flex size-40 shrink-0 items-center justify-center rounded-md bg-paper text-ink-2">
              <Icon name={icon} size={18} />
            </span>
            <div className="flex min-w-0 flex-col">
              <dt className="type-overline text-muted">{label}</dt>
              <dd className="type-label-m text-ink">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
