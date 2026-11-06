import { Icon } from "../../../components/Icon";
import type { CarMedia } from "../api";

type MediaThumbProps = {
  media: CarMedia;
  // Hides the play sign, for a tile that shows something else on top.
  hidePlay?: boolean;
};

// A photo, or a video's first frame with a play sign, filling its box. The
// surrounding button names it.
export function MediaThumb({ media, hidePlay = false }: MediaThumbProps) {
  if (media.type === "image") {
    return <img alt="" className="size-full object-cover" src={media.link} />;
  }
  return (
    <>
      <video className="size-full object-cover" muted playsInline preload="metadata" src={media.link} />
      {!hidePlay && (
        <span className="absolute inset-0 m-auto flex size-48 items-center justify-center rounded-full bg-surface text-ink">
          <Icon className="fill-current" name="play" size={18} />
        </span>
      )}
    </>
  );
}
