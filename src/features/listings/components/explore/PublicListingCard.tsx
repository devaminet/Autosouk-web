import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import carImage from "../../../../assets/car.svg";
import { Icon } from "../../../../components/Icon";
import { formatDay } from "../../../../lib/format";
import { listingPath } from "../../../../lib/paths";
import type { PublicListing } from "../../api";

type PublicListingCardProps = {
  listing: PublicListing;
};

// A listing in the explore grid. The API sends no price or specs for it yet.
export function PublicListingCard({ listing }: PublicListingCardProps) {
  const { t, i18n } = useTranslation(["listings", "enums"]);
  const media = listing.car?.carMedias ?? [];
  // The API lists the primary media first, and a video can't be a thumbnail.
  const image = media.find(({ type }) => type === "image");
  const city = listing.car?.city;

  return (
    <li className="relative flex flex-col gap-12 rounded-2xl bg-surface p-8 pb-16 shadow-elevation-1 hover:shadow-elevation-2">
      <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-paper">
        {image ? (
          <img alt="" className="size-full object-cover" loading="lazy" src={image.link} />
        ) : (
          <span className="flex size-full items-center justify-center bg-linear-to-br from-brand to-brand-ink px-32">
            <img alt="" className="w-full" src={carImage} />
          </span>
        )}
        {media.length > 0 && (
          <span className="absolute bottom-12 inset-s-12 flex items-center gap-4 rounded-full bg-ink px-8 py-2 type-label-s text-surface">
            <Icon name="camera" size={12} />
            <bdi dir="ltr">{media.length}</bdi>
            <span className="sr-only">{t("explore.card.media", { count: media.length })}</span>
          </span>
        )}
      </div>
      <div className="flex flex-col gap-8 px-8">
        <h3 className="type-h5 text-ink">
          {/* The link covers the whole card. */}
          <Link
            // Titles are often Latin in an Arabic page, so they keep their own direction.
            dir="auto"
            className="rounded-xs after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            to={listingPath(listing.id)}
          >
            {listing.title}
          </Link>
        </h3>
        <div className="flex flex-wrap items-center justify-between gap-8 type-label-s text-muted">
          <span>{t("explore.card.listed", { day: formatDay(listing.createdAt, i18n.language) })}</span>
          {city && (
            <span className="flex items-center gap-4">
              <Icon name="map-pin" size={12} />
              {t(`enums:city.${city.slug}`, { defaultValue: city.name })}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
