import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Icon } from "../../../components/Icon";
import { useMenu } from "../../../hooks/useMenu";

type ListingActionsMenuProps = {
  title: string;
  // Where to continue a draft. The table shows its own button for this.
  continueTo?: string;
  // Where to edit the listing. The table shows its own button for this too.
  edit?: { to: string; label: "edit" | "editResubmit" };
  // Where to manage its photos and videos. The table shows its own button too.
  mediaTo?: string;
  // The listing as buyers see it.
  viewTo?: string;
  onDelete: () => void;
};

// In px: the space between the button and the panel, and the room the panel needs.
const gap = 8;
const roomBelow = 200;

// The "…" button on a listing, for actions that don't need their own button.
export function ListingActionsMenu({ title, continueTo, edit, mediaTo, viewTo, onDelete }: ListingActionsMenuProps) {
  const { t } = useTranslation("listings");
  const { open, setOpen, root } = useMenu();
  const trigger = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<CSSProperties>({});

  // The panel is fixed to the window, so a scrolling table can't clip it. It
  // would drift from its button on scroll, so scrolling closes it.
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, { capture: true, passive: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
    };
  }, [open, setOpen]);

  const toggle = () => {
    const button = trigger.current;
    if (!open && button) {
      const rect = button.getBoundingClientRect();
      const isRtl = getComputedStyle(button).direction === "rtl";
      // Opens upwards when the window has little room below the button.
      const below = window.innerHeight - rect.bottom > roomBelow;
      setPosition({
        // The client width leaves out the page's scrollbar, which the window width counts.
        insetInlineEnd: isRtl ? rect.left : document.documentElement.clientWidth - rect.right,
        ...(below ? { top: rect.bottom + gap } : { bottom: window.innerHeight - rect.top + gap }),
      });
    }
    setOpen((value) => !value);
  };

  return (
    <div className="relative shrink-0" ref={root}>
      <button
        aria-expanded={open}
        aria-label={t("actions.menu", { title })}
        className="flex size-40 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:size-control-s md:bg-surface md:ring-1 md:ring-line-strong md:ring-inset md:hover:bg-surface-2"
        onClick={toggle}
        ref={trigger}
        type="button"
      >
        <Icon name="more-horizontal" size={16} />
      </button>
      {open && (
        // The position comes from the button's place on screen, so it can't be a class.
        <div
          className="fixed z-20 flex min-w-max flex-col gap-4 rounded-md bg-surface p-4 shadow-elevation-2"
          style={position}
        >
          {continueTo && (
            <Link
              className="flex min-h-control-s items-center gap-8 rounded-sm px-12 type-label-m text-ink hover:bg-paper focus-visible:outline-2 focus-visible:outline-brand"
              to={continueTo}
            >
              <Icon name="arrow-right" size={16} />
              {t("actions.continue")}
            </Link>
          )}
          {edit && (
            <Link
              className="flex min-h-control-s items-center gap-8 rounded-sm px-12 type-label-m text-ink hover:bg-paper focus-visible:outline-2 focus-visible:outline-brand"
              onClick={() => {
                setOpen(false);
                // The drawer returns focus to what had it when it opened, and this link is about to go.
                trigger.current?.focus();
              }}
              preventScrollReset
              to={edit.to}
            >
              <Icon name="pencil" size={16} />
              {t(`actions.${edit.label}`)}
            </Link>
          )}
          {viewTo && (
            <Link
              className="flex min-h-control-s items-center gap-8 rounded-sm px-12 type-label-m text-ink hover:bg-paper focus-visible:outline-2 focus-visible:outline-brand"
              to={viewTo}
            >
              <Icon name="eye" size={16} />
              {t("actions.viewListing", { title })}
            </Link>
          )}
          {mediaTo && (
            <Link
              className="flex min-h-control-s items-center gap-8 rounded-sm px-12 type-label-m text-ink hover:bg-paper focus-visible:outline-2 focus-visible:outline-brand"
              to={mediaTo}
            >
              <Icon name="image" size={16} />
              {t("actions.media")}
            </Link>
          )}
          <button
            className="flex min-h-control-s w-full cursor-pointer items-center gap-8 rounded-sm px-12 text-start type-label-m text-danger hover:bg-paper focus-visible:outline-2 focus-visible:outline-brand"
            onClick={() => {
              setOpen(false);
              // This button is about to go. The dialog returns focus to the trigger when it closes.
              trigger.current?.focus();
              onDelete();
            }}
            type="button"
          >
            <Icon name="trash" size={16} />
            {t("actions.delete")}
          </button>
        </div>
      )}
    </div>
  );
}
