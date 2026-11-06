import { useIsMutating } from "@tanstack/react-query";
import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router";
import { Alert } from "../../../components/Alert";
import { Icon } from "../../../components/Icon";
import type { ListingDetail } from "../api";
import { updateListingKey, useEquipment, useListing, useLookups, useUpdateListing } from "../hooks";
import { resumeDraftPath } from "../wizardSteps";
import { EditListingForm } from "./EditListingForm";

type PanelProps = {
  listingId: number;
  titleId: string;
  onClose: () => void;
  onSaved: () => void;
  onDelete: (listing: ListingDetail) => void;
};

// Mounted only while the drawer is open, so each opening starts clean.
function EditListingPanel({ listingId, titleId, onClose, onSaved, onDelete }: PanelProps) {
  const { t } = useTranslation("listings");
  const query = useListing(listingId);
  const lookups = useLookups();
  const equipment = useEquipment();
  const update = useUpdateListing();
  const listing = query.data;
  const error = query.error ?? lookups.error ?? equipment.error;

  const content = () => {
    if (error) {
      return (
        <div className="p-20 md:p-32" role="alert">
          <Alert tone="danger">{error.message}</Alert>
        </div>
      );
    }
    if (!listing || !lookups.data || !equipment.data) {
      return <output className="block p-20 type-body-m text-muted md:p-32">{t("common:loading")}</output>;
    }
    // A draft is finished in the wizard.
    if (listing.status === "draft") {
      return <Navigate replace to={resumeDraftPath(listing)} />;
    }
    return (
      <EditListingForm
        equipment={equipment.data}
        error={update.error}
        isPending={update.isPending}
        listing={listing}
        lookups={lookups.data}
        onCancel={onClose}
        onDelete={() => onDelete(listing)}
        onSave={(changes) => {
          if (!changes) {
            onClose();
            return;
          }
          update.mutate({ id: listing.id, changes }, { onSuccess: onSaved });
        }}
      />
    );
  };

  return (
    <>
      <header className="flex items-start justify-between gap-16 border-b border-line p-20 md:px-32 md:py-24">
        <div className="flex min-w-0 flex-col gap-4">
          <p className="type-overline text-muted">{t("edit.overline")}</p>
          <h2 className="type-h4 text-ink" dir="auto" id={titleId}>
            {listing?.title ?? t("edit.overline")}
          </h2>
        </div>
        <button
          aria-label={t("edit.close")}
          className="flex size-40 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line text-brand hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-45"
          disabled={update.isPending}
          onClick={onClose}
          type="button"
        >
          <Icon name="x" size={18} />
        </button>
      </header>
      {content()}
    </>
  );
}

type EditListingDrawerProps = {
  // The listing to edit. The drawer is closed while this is null.
  listingId: number | null;
  onClose: () => void;
  onSaved: () => void;
  onDelete: (listing: ListingDetail) => void;
};

// A panel from the inline end on wide screens, full screen on small ones.
// The native dialog traps focus, closes on Escape and returns focus to the
// element that opened it.
export function EditListingDrawer({ listingId, onClose, onSaved, onDelete }: EditListingDrawerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const isSaving = useIsMutating({ mutationKey: updateListingKey }) > 0;
  const isOpen = listingId !== null;

  useEffect(() => {
    const element = dialog.current;
    if (isOpen && !element?.open) {
      element?.showModal();
    } else if (!isOpen && element?.open) {
      element.close();
    }
  }, [isOpen]);

  return (
    <dialog
      aria-labelledby={titleId}
      className="my-0 me-0 ms-auto h-dvh max-h-dvh w-full max-w-auth-wide bg-surface text-ink shadow-overlay backdrop:bg-night/50 open:flex open:flex-col"
      onCancel={(event) => {
        // The request can't be called back, so stay open until it finishes.
        if (isSaving) {
          event.preventDefault();
        }
      }}
      onClose={onClose}
      ref={dialog}
    >
      {listingId !== null && (
        <EditListingPanel
          key={listingId}
          listingId={listingId}
          onClose={onClose}
          onDelete={onDelete}
          onSaved={onSaved}
          titleId={titleId}
        />
      )}
    </dialog>
  );
}
