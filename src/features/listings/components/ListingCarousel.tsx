import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import type { CarMedia } from "../api";
import { MediaThumb } from "./MediaThumb";

const arrow =
  "absolute top-1/2 flex size-40 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-ink shadow-elevation-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

type ListingCarouselProps = {
  media: CarMedia[];
  // Opens the full-screen viewer on the item at this position.
  onOpen: (index: number) => void;
};

// The gallery on small screens: one item at a time, in place. Swiping scrolls
// natively and snaps to each item. The arrows show there is more.
export function ListingCarousel({ media, onOpen }: ListingCarouselProps) {
  const { t } = useTranslation("listings");
  const list = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);
  // Where an arrow is scrolling to. Until it gets there, the scroll positions
  // on the way don't change the counter, and the next tap counts from it.
  const heading = useRef<number | null>(null);

  const nameOf = (item: CarMedia, index: number) =>
    t(item.type === "image" ? "photos.photo" : "photos.video", { number: index + 1 });

  // Wraps around at both ends, like the full-screen viewer.
  const step = (delta: number) => {
    const index = ((heading.current ?? current) + delta + media.length) % media.length;
    heading.current = index;
    setCurrent(index);
    const element = list.current;
    if (!element) {
      return;
    }
    // Right to left, the scroll position counts down from zero.
    const isRtl = getComputedStyle(element).direction === "rtl";
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo?.({
      left: index * element.clientWidth * (isRtl ? -1 : 1),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  // Follows swipes, which scroll the list without the arrows.
  const onScroll = () => {
    const element = list.current;
    if (!element || element.clientWidth === 0) {
      return;
    }
    const position = Math.abs(element.scrollLeft) / element.clientWidth;
    if (heading.current !== null) {
      if (Math.abs(position - heading.current) < 0.01) {
        heading.current = null;
      }
      return;
    }
    setCurrent(Math.round(position));
  };

  return (
    <section aria-label={t("listing.gallery")} aria-roledescription={t("listing.carousel")} className="relative">
      <ul
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        // A swipe takes over from an arrow's scroll.
        onPointerDown={() => {
          heading.current = null;
        }}
        onScroll={onScroll}
        ref={list}
      >
        {media.map((item, index) => (
          <li
            aria-label={t("listing.slide", { current: index + 1, total: media.length })}
            aria-roledescription={t("listing.slideRole")}
            className="aspect-4/3 w-full shrink-0 snap-start"
            key={item.id}
          >
            <button
              aria-label={t("viewer.open", { name: nameOf(item, index) })}
              className="relative block size-full cursor-zoom-in overflow-hidden bg-night focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-surface"
              onClick={() => onOpen(index)}
              type="button"
            >
              <MediaThumb media={item} />
            </button>
          </li>
        ))}
      </ul>
      {media.length > 1 && (
        <>
          <button
            aria-label={t("listing.previousMedia")}
            className={`${arrow} inset-s-12`}
            onClick={() => step(-1)}
            type="button"
          >
            <Icon name="chevron-left" size={20} />
          </button>
          <button
            aria-label={t("listing.nextMedia")}
            className={`${arrow} inset-e-12`}
            onClick={() => step(1)}
            type="button"
          >
            <Icon name="chevron-right" size={20} />
          </button>
        </>
      )}
      <p
        aria-live="polite"
        className="pointer-events-none absolute bottom-12 inset-e-12 rounded-full bg-night/60 px-8 py-2 type-label-s text-on-brand"
      >
        <bdi dir="ltr">
          {current + 1} / {media.length}
        </bdi>
      </p>
    </section>
  );
}
