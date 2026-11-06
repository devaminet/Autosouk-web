import { useRef } from "react";
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
  onDelete: () => void;
};

// The "…" button on a listing, for actions that don't need their own button.
export function ListingActionsMenu({ title, continueTo, edit, mediaTo, onDelete }: ListingActionsMenuProps) {
  const { t } = useTranslation("listings");
  const { open, setOpen, root } = useMenu();
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <div className="relative shrink-0" ref={root}>
      <button
        aria-expanded={open}
        aria-label={t("actions.menu", { title })}
        className="flex size-40 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:size-control-s md:bg-surface md:ring-1 md:ring-line-strong md:ring-inset md:hover:bg-surface-2"
        onClick={() => setOpen((value) => !value)}
        ref={trigger}
        type="button"
      >
        <Icon name="more-horizontal" size={16} />
      </button>
      {open && (
        <div className="absolute inset-e-0 top-full z-10 mt-8 flex min-w-max flex-col gap-4 rounded-md bg-surface p-4 shadow-elevation-2">
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
