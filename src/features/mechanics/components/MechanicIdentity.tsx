import { useTranslation } from "react-i18next";
import { Badge } from "../../../components/Badge";
import { Icon } from "../../../components/Icon";
import type { PublicMechanic } from "../api";
import { initialsOf } from "../workshopForm";
import { GarageRating } from "./GarageRating";

type MechanicIdentityProps = {
  mechanic: PublicMechanic;
  // The city's name, translated.
  city: string;
};

// The workshop's logo, name, status, rating and address, under its photos.
export function MechanicIdentity({ mechanic, city }: MechanicIdentityProps) {
  const { t } = useTranslation("mechanics");

  return (
    <header className="flex flex-col items-center gap-12 text-center md:flex-row md:items-end md:gap-24 md:text-start">
      <span className="-mt-64 flex size-96 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft type-h2 text-brand-ink ring-4 ring-paper md:ms-24 md:-mt-48">
        {mechanic.profileImageUrl ? (
          <img alt="" className="size-full object-cover" src={mechanic.profileImageUrl} />
        ) : (
          <span aria-hidden="true" dir="auto">
            {initialsOf(mechanic.name)}
          </span>
        )}
      </span>
      <div className="flex min-w-0 flex-col items-center gap-8 md:items-start">
        <div className="flex flex-wrap items-center justify-center gap-12 md:justify-start">
          <h1 className="type-h1 text-ink md:type-display-m" dir="auto">
            {mechanic.name}
          </h1>
          <Badge tone={mechanic.isActive ? "success" : "warning"}>
            {t(mechanic.isActive ? "profile.accepting" : "profile.notAccepting")}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-4 md:justify-start">
          <GarageRating count={mechanic.rating.count} long rating={mechanic.rating.average} />
          <p className="flex items-center gap-4 type-body-m text-muted">
            <Icon name="map-pin" size={16} />
            <span dir="auto">
              {mechanic.address}, {city}
            </span>
          </p>
        </div>
      </div>
    </header>
  );
}
