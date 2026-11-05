import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import type { SellerListing } from "../api";

type DeleteListingDialogProps = {
  // The listing to confirm. The dialog is closed while this is null.
  listing: SellerListing | null;
  isPending: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

// A sheet on small screens and a centred modal on wide ones. The native dialog
// traps focus, closes on Escape and returns focus to the element that opened it.
export function DeleteListingDialog({
  listing,
  isPending,
  error,
  onConfirm,
  onClose,
}: DeleteListingDialogProps) {
  const { t } = useTranslation("listings");
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const isOpen = listing !== null;

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
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="mt-auto mb-0 w-full max-w-none rounded-t-xl bg-surface p-24 text-ink shadow-overlay backdrop:bg-night/50 md:m-auto md:max-w-auth md:rounded-xl"
      onCancel={(event) => {
        // The request can't be called back, so stay open until it finishes.
        if (isPending) {
          event.preventDefault();
        }
      }}
      onClose={onClose}
      ref={dialog}
    >
      {listing && (
        <div className="flex flex-col gap-16">
          <div className="flex flex-col gap-8">
            <h2 className="type-h3" id={titleId}>
              {t("deleteDialog.title")}
            </h2>
            <p className="type-h5" dir="auto">
              {listing.title}
            </p>
            <p className="type-body-s text-muted" id={descriptionId}>
              {t("deleteDialog.description")}
            </p>
          </div>
          {error && (
            <div role="alert">
              <Alert tone="danger">{error}</Alert>
            </div>
          )}
          <div className="flex flex-col-reverse gap-8 md:flex-row md:justify-end">
            <Button disabled={isPending} onClick={onClose}>
              {t("deleteDialog.cancel")}
            </Button>
            <Button isPending={isPending} onClick={onConfirm} variant="danger">
              {t("actions.delete")}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
}
