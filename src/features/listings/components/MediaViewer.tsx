import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import type { CarMedia } from "../api";

const roundButton =
  "flex size-control-m shrink-0 cursor-pointer items-center justify-center rounded-full bg-night-2 text-on-brand hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface";

type MediaViewerProps = {
  media: CarMedia[];
  // The item on screen. The viewer is closed while this is null.
  index: number | null;
  // Names the dialog, such as the listing's title.
  title: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

// Photos at full size and videos with their controls, one at a time. The
// native dialog traps focus, closes on Escape and returns focus to the item
// that opened it.
export function MediaViewer({ media, index, title, onIndexChange, onClose }: MediaViewerProps) {
  const { t, i18n } = useTranslation("listings");
  const dialog = useRef<HTMLDialogElement>(null);
  const current = index === null ? undefined : media[index];
  const isOpen = current !== undefined;

  useEffect(() => {
    const element = dialog.current;
    if (isOpen && !element?.open) {
      element?.showModal();
    } else if (!isOpen && element?.open) {
      element.close();
    }
  }, [isOpen]);

  const nameOf = (item: CarMedia, position: number) =>
    t(item.type === "image" ? "photos.photo" : "photos.video", { number: position + 1 });

  // Wraps around, so the buttons never disable and drop the focus.
  const go = (target: number) => onIndexChange((target + media.length) % media.length);

  // The arrow keys follow the reading direction.
  const step = i18n.dir() === "rtl" ? -1 : 1;
  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (index === null || event.target instanceof HTMLVideoElement) {
      return;
    }
    if (event.key === "ArrowRight") {
      go(index + step);
    } else if (event.key === "ArrowLeft") {
      go(index - step);
    }
  };

  return (
    <dialog
      aria-label={t("viewer.title", { title })}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-night text-on-brand backdrop:bg-night open:flex open:flex-col"
      onClose={onClose}
      onKeyDown={onKeyDown}
      ref={dialog}
    >
      {current && index !== null && (
        <>
          <header className="flex items-center justify-between gap-16 px-20 py-16 md:px-32">
            <p aria-live="polite" className="min-w-0 truncate type-label-m">
              <span className="sr-only">{nameOf(current, index)}, </span>
              <bdi dir="ltr">
                {index + 1} / {media.length}
              </bdi>
            </p>
            <button aria-label={t("viewer.close")} className={roundButton} onClick={onClose} type="button">
              <Icon name="x" size={20} />
            </button>
          </header>
          <div className="relative flex min-h-0 flex-1 items-center justify-center gap-12 px-12 md:px-32">
            <button
              aria-label={t("viewer.previous")}
              className={roundButton}
              onClick={() => go(index - 1)}
              type="button"
            >
              <Icon name="chevron-left" size={20} />
            </button>
            <div className="flex size-full min-w-0 items-center justify-center">
              {current.type === "image" ? (
                <img alt={nameOf(current, index)} className="size-full object-contain" src={current.link} />
              ) : (
                // Sellers upload videos without captions, and the API has nowhere to keep them.
                // oxlint-disable-next-line jsx-a11y/media-has-caption
                <video
                  aria-label={nameOf(current, index)}
                  autoPlay
                  className="size-full"
                  controls
                  key={current.id}
                  playsInline
                  src={current.link}
                />
              )}
            </div>
            <button
              aria-label={t("viewer.next")}
              className={roundButton}
              onClick={() => go(index + 1)}
              type="button"
            >
              <Icon name="chevron-right" size={20} />
            </button>
          </div>
          {media.length > 1 && (
            <ul className="flex gap-8 overflow-x-auto px-20 py-16 md:justify-center md:px-32">
              {media.map((item, position) => (
                <li className="shrink-0" key={item.id}>
                  <button
                    aria-current={position === index}
                    aria-label={t("viewer.show", { name: nameOf(item, position) })}
                    className={`relative block h-48 aspect-4/3 cursor-pointer overflow-hidden rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface ${
                      position === index ? "ring-2 ring-surface" : "opacity-60 hover:opacity-100"
                    }`}
                    onClick={() => go(position)}
                    type="button"
                  >
                    {item.type === "image" ? (
                      <img alt="" className="size-full object-cover" loading="lazy" src={item.link} />
                    ) : (
                      <>
                        <video className="size-full object-cover" muted preload="metadata" src={item.link} />
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Icon className="fill-current" name="play" size={14} />
                        </span>
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </dialog>
  );
}
