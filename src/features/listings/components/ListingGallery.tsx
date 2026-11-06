import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import type { CarMedia } from "../api";
import { ListingCarousel } from "./ListingCarousel";
import { MediaThumb } from "./MediaThumb";

// The cover and the next four items on wide screens. Small screens get a carousel.
const shown = 5;

type ListingGalleryProps = {
  media: CarMedia[];
  // Opens the viewer on the item at this position.
  onOpen: (index: number) => void;
};

const tile =
  "relative block size-full cursor-zoom-in overflow-hidden bg-night focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function ListingGallery({ media, onOpen }: ListingGalleryProps) {
  const { t } = useTranslation("listings");
  const nameOf = (item: CarMedia, index: number) =>
    t(item.type === "image" ? "photos.photo" : "photos.video", { number: index + 1 });
  const hidden = media.length - shown;

  if (media.length === 0) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-8 bg-night text-subtle md:rounded-xl">
        <Icon name="car" size={48} />
        <p className="type-body-s">{t("listing.noMedia")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="md:hidden">
        <ListingCarousel media={media} onOpen={onOpen} />
      </div>
      <ul aria-label={t("listing.gallery")} className="hidden grid-cols-4 gap-8 md:grid">
        {media.slice(0, shown).map((item, index) => {
          const isLast = index === shown - 1 && hidden > 0;
          return (
            <li
              className={`aspect-4/3 overflow-hidden ${index === 0 ? "col-span-2 row-span-2 rounded-xl" : "rounded-lg"}`}
              key={item.id}
            >
              <button
                aria-label={
                  isLast
                    ? t("listing.showAllMedia", { count: media.length })
                    : t("viewer.open", { name: nameOf(item, index) })
                }
                className={tile}
                onClick={() => onOpen(index)}
                type="button"
              >
                <MediaThumb hidePlay={isLast} media={item} />
                {isLast && (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-night/60 type-label-m text-on-brand">
                    <Icon name="image" size={20} />
                    <bdi dir="ltr">+{hidden}</bdi>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
