import { useTranslation } from "react-i18next";
import { formatNumber } from "../../../lib/format";

type GarageGalleryProps = {
  photos: { id: number; link: string }[];
};

// How many photos fit beside the first one on wide screens.
const thumbnails = 4;

// The first garage photo large, and the next ones beside it on wide screens.
// Without photos, a night banner stands in.
export function GarageGallery({ photos }: GarageGalleryProps) {
  const { t } = useTranslation("mechanics");
  const [first, ...rest] = photos;
  const shown = rest.slice(0, thumbnails);
  const more = rest.length - shown.length;

  if (!first) {
    return <div aria-hidden="true" className="aspect-video w-full rounded-2xl bg-night bg-zellige md:aspect-7/2" />;
  }
  return (
    <div className="grid aspect-video grid-cols-1 gap-12 md:aspect-7/2 md:grid-cols-4 md:grid-rows-2">
      <img
        alt={t("profile.photo", { number: 1 })}
        className="size-full rounded-2xl bg-paper object-cover md:col-span-2 md:row-span-2"
        src={first.link}
      />
      {shown.map(({ id, link }, index) => (
        <div className="relative hidden overflow-hidden rounded-2xl bg-paper md:block" key={id}>
          <img alt={t("profile.photo", { number: index + 2 })} className="size-full object-cover" loading="lazy" src={link} />
          {more > 0 && index === shown.length - 1 && (
            <span className="absolute inset-0 flex items-center justify-center bg-night/60 type-h4 text-surface">
              +<bdi dir="ltr">{formatNumber(more)}</bdi>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
