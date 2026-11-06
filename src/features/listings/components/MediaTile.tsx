import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import type { CarMedia } from "../api";

const roundButton =
  "flex size-32 cursor-pointer items-center justify-center rounded-full bg-surface shadow-elevation-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-45";

type MediaTileProps = {
  media: CarMedia;
  // Its position in the grid, to name it.
  number: number;
  busy: boolean;
  onMakeCover: () => void;
  onDelete: () => void;
};

// One uploaded photo or video. Only a photo can be the cover.
export function MediaTile({ media, number, busy, onMakeCover, onDelete }: MediaTileProps) {
  const { t } = useTranslation("listings");
  const isImage = media.type === "image";
  const name = t(isImage ? "photos.photo" : "photos.video", { number });

  return (
    <li
      aria-busy={busy}
      className={`relative aspect-4/3 overflow-hidden rounded-lg bg-night ${
        media.isPrimary ? "ring-2 ring-brand ring-offset-2 ring-offset-surface" : ""
      } ${busy ? "opacity-45" : ""}`}
    >
      {isImage ? (
        <img alt={name} className="size-full object-cover" loading="lazy" src={media.link} />
      ) : (
        <>
          <video aria-label={name} className="size-full object-cover" muted playsInline preload="metadata" src={media.link} />
          <span
            aria-hidden="true"
            className="absolute inset-0 m-auto flex size-40 items-center justify-center rounded-full bg-surface text-ink"
          >
            <Icon className="fill-current" name="play" size={16} />
          </span>
        </>
      )}
      {media.isPrimary && (
        <span className="absolute bottom-8 inset-s-8 flex items-center gap-4 rounded-full bg-ink px-8 py-2 type-label-s text-surface">
          <Icon className="fill-current text-saffron" name="star" size={12} />
          {t("photos.cover")}
        </span>
      )}
      <div className="absolute top-8 inset-e-8 flex gap-8">
        {isImage && !media.isPrimary && (
          <button
            aria-label={t("photos.makeCover", { number })}
            className={`${roundButton} text-ink`}
            disabled={busy}
            onClick={onMakeCover}
            type="button"
          >
            <Icon name="star" size={16} />
          </button>
        )}
        <button
          aria-label={t("photos.delete", { name })}
          className={`${roundButton} text-danger`}
          disabled={busy}
          onClick={onDelete}
          type="button"
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </li>
  );
}
