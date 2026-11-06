import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Icon } from "../../../components/Icon";
import { listingMediaPath } from "../../../lib/paths";
import type { ListingCar } from "../api";
import { MediaSummary } from "./MediaSummary";

const shown = 3;

type EditListingMediaProps = {
  listingId: number;
  car: ListingCar;
};

// A glimpse of the media in the edit drawer. Media has its own page, as new
// files are confirmed apart from the other changes.
export function EditListingMedia({ listingId, car }: EditListingMediaProps) {
  const { t } = useTranslation("listings");
  const media = car.carMedias;
  const photos = media.filter(({ type }) => type === "image").length;
  const to = listingMediaPath(listingId);

  return (
    <section className="flex flex-col gap-12">
      <div className="flex items-center justify-between gap-12">
        <h3 className="type-h5 text-ink">{t("photos.title")}</h3>
        <Link
          aria-label={t("media.manageAllLabel")}
          className="flex items-center gap-4 rounded-xs type-label-s text-brand underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          to={to}
        >
          {t("media.manageAll")} <bdi dir="ltr">{media.length}</bdi>
          <Icon name="arrow-right" size={14} />
        </Link>
      </div>
      <MediaSummary
        hasCover={media.some(({ isPrimary }) => isPrimary)}
        photos={photos}
        showChecks={false}
        uploading={0}
        videos={media.length - photos}
      />
      <ul className="grid grid-cols-4 gap-8">
        {media.slice(0, shown).map((item) => (
          <li
            className={`relative aspect-4/3 overflow-hidden rounded-md bg-night ${
              item.isPrimary ? "ring-2 ring-brand ring-offset-2 ring-offset-surface" : ""
            }`}
            key={item.id}
          >
            {item.type === "image" ? (
              <img alt="" className="size-full object-cover" loading="lazy" src={item.link} />
            ) : (
              <video className="size-full object-cover" muted playsInline preload="metadata" src={item.link} />
            )}
            {item.isPrimary && (
              <span className="absolute bottom-4 inset-s-4 flex items-center gap-4 rounded-full bg-ink px-4 type-label-s text-surface">
                <Icon className="fill-current text-saffron" name="star" size={10} />
                {t("photos.cover")}
              </span>
            )}
          </li>
        ))}
        <li>
          <Link
            aria-label={t("photos.add")}
            className="flex aspect-4/3 flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed border-line-strong bg-surface-2 type-label-s text-ink hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            to={to}
          >
            <Icon className="text-brand" name="plus" size={16} />
            {t("media.add")}
          </Link>
        </li>
      </ul>
    </section>
  );
}
