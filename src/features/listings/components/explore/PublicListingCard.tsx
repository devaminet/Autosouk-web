import { Fragment } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import carImage from "../../../../assets/car.svg";
import { Icon } from "../../../../components/Icon";
import { formatNumber } from "../../../../lib/format";
import { FavoriteButton } from "../../../favorites/components/FavoriteButton";
import { listingPath } from "../../../../lib/paths";
import type { ListingCard } from "../../api";
import { distanceLabel } from "../../distance";

type PublicListingCardProps = {
  listing: ListingCard;
  // Set when buyers can no longer open the listing, such as a sold car. The
  // card is then dimmed, with this label instead of its link and heart.
  unavailable?: string;
  // Actions below the price.
  children?: ReactNode;
};

// A listing in a grid of results.
export function PublicListingCard({ listing, unavailable, children }: PublicListingCardProps) {
  const { t } = useTranslation(["listings", "enums"]);
  const car = listing.car;
  const media = car?.carMedias ?? [];
  // The API lists the primary media first, and a video can't be a thumbnail.
  const image = media.find(({ type }) => type === "image");
  const city = car?.city;
  const fuel = car?.carburant?.carburant;
  const specs: { key: string; value: ReactNode }[] = car
    ? [
        { key: "year", value: <bdi dir="ltr">{car.year}</bdi> },
        {
          key: "distance",
          value: (
            <>
              <bdi dir="ltr">{distanceLabel(car.distance)}</bdi> {t("units.km")}
            </>
          ),
        },
        ...(fuel ? [{ key: "fuel", value: t(`enums:carburant.${fuel}`, { defaultValue: fuel }) }] : []),
        { key: "transmission", value: t(`enums:transmission.${car.transmission}`) },
      ]
    : [];

  return (
    <li className="relative flex flex-col gap-12 rounded-2xl bg-surface p-8 pb-16 shadow-elevation-1 hover:shadow-elevation-2">
      <div className={`relative aspect-4/3 overflow-hidden rounded-xl bg-paper ${unavailable ? "opacity-60 grayscale" : ""}`}>
        {image ? (
          <img alt="" className="size-full object-cover" loading="lazy" src={image.link} />
        ) : (
          <span className="flex size-full items-center justify-center bg-linear-to-br from-brand to-brand-ink px-32">
            <img alt="" className="w-full" src={carImage} />
          </span>
        )}
        {unavailable && (
          <span className="absolute top-12 inset-s-12 rounded-full bg-ink px-8 py-2 type-label-s text-surface">
            {unavailable}
          </span>
        )}
        {!unavailable && listing.inspectionScore !== null && (
          <span className="absolute top-12 inset-s-12 flex items-center gap-4 rounded-full bg-surface px-8 py-2 type-label-s text-success">
            <Icon name="shield" size={12} />
            {t("explore.card.inspected")} · <bdi dir="ltr">{listing.inspectionScore}</bdi>
          </span>
        )}
        {!unavailable && (
          // Above the link that covers the card.
          <div className="absolute top-12 inset-e-12 z-10">
            <FavoriteButton listingId={listing.id} title={listing.title} />
          </div>
        )}
        {!unavailable && media.length > 0 && (
          <span className="absolute bottom-12 inset-s-12 flex items-center gap-4 rounded-full bg-ink px-8 py-2 type-label-s text-surface">
            <Icon name="camera" size={12} />
            <bdi dir="ltr">{media.length}</bdi>
            <span className="sr-only">{t("explore.card.media", { count: media.length })}</span>
          </span>
        )}
      </div>
      <div className="flex flex-col gap-8 px-8">
        <h3 className={`type-h5 ${unavailable ? "text-muted" : "text-ink"}`}>
          {unavailable ? (
            <span dir="auto">{listing.title}</span>
          ) : (
            // The link covers the whole card.
            <Link
              // Titles are often Latin in an Arabic page, so they keep their own direction.
              dir="auto"
              className="rounded-xs after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              to={listingPath(listing.id)}
            >
              {listing.title}
            </Link>
          )}
        </h3>
        {specs.length > 0 && (
          <p className="type-body-s text-muted">
            {specs.map(({ key, value }, index) => (
              <Fragment key={key}>
                {index > 0 && " · "}
                {value}
              </Fragment>
            ))}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-8">
          {car && (
            <p className="whitespace-nowrap">
              <bdi className={`type-price-m ${unavailable ? "text-muted" : "text-ink"}`} dir="ltr">
                {formatNumber(car.price)}
              </bdi>{" "}
              <span className="type-mono-s text-muted">{t("units.mad")}</span>
            </p>
          )}
          {!unavailable && city && (
            <span className="flex items-center gap-4 type-label-s text-muted">
              <Icon name="map-pin" size={12} />
              {t(`enums:city.${city.slug}`, { defaultValue: city.name })}
            </span>
          )}
        </div>
        {children}
      </div>
    </li>
  );
}
