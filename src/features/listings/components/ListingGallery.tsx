import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import type { CarMedia } from "../api";

// The cover and the next four items on wide screens, the cover alone on small ones.
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
    <ul aria-label={t("listing.gallery")} className="grid grid-cols-1 gap-8 md:grid-cols-4">
      {media.slice(0, shown).map((item, index) => {
        const isLast = index === shown - 1 && hidden > 0;
        return (
          <li
            className={
              index === 0
                ? "aspect-4/3 md:col-span-2 md:row-span-2 md:overflow-hidden md:rounded-xl"
                : "hidden aspect-4/3 overflow-hidden rounded-lg md:block"
            }
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
              {item.type === "image" ? (
                <img alt="" className="size-full object-cover" src={item.link} />
              ) : (
                <>
                  <video className="size-full object-cover" muted playsInline preload="metadata" src={item.link} />
                  {!isLast && (
                    <span className="absolute inset-0 m-auto flex size-48 items-center justify-center rounded-full bg-surface text-ink">
                      <Icon className="fill-current" name="play" size={18} />
                    </span>
                  )}
                </>
              )}
              {isLast && (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-night/60 type-label-m text-on-brand">
                  <Icon name="image" size={20} />
                  <bdi dir="ltr">+{hidden}</bdi>
                </span>
              )}
              {index === 0 && (
                <span className="absolute bottom-12 inset-e-12 rounded-full bg-night/60 px-8 py-2 type-label-s text-on-brand md:hidden">
                  <bdi dir="ltr">
                    1 / {media.length}
                  </bdi>
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
