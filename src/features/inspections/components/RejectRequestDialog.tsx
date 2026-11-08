import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { useModalDialog } from "../../../hooks/useModalDialog";

type RejectRequestDialogProps = {
  open: boolean;
  buyer: string;
  car: string;
  isPending: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

// Asks before the mechanic turns a buyer's request down for good.
export function RejectRequestDialog({ open, buyer, car, isPending, error, onConfirm, onClose }: RejectRequestDialogProps) {
  const { t } = useTranslation("inspections");
  const dialog = useModalDialog(open);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="mt-auto mb-0 w-full max-w-none rounded-t-xl bg-surface p-24 text-ink shadow-overlay backdrop:bg-night/50 md:m-auto md:max-w-auth md:rounded-xl"
      onCancel={(event) => {
        if (isPending) {
          event.preventDefault();
        }
      }}
      onClose={onClose}
      ref={dialog}
    >
      {open && (
        <div className="flex flex-col gap-16">
          <h2 className="type-h3" id={titleId}>
            {t("queue.rejectDialog.title")}
          </h2>
          <p className="type-body-s text-muted" id={descriptionId}>
            {t("queue.rejectDialog.description", { name: buyer, car })}
          </p>
          {error && (
            <div role="alert">
              <Alert tone="danger">{error}</Alert>
            </div>
          )}
          <div className="flex flex-col-reverse gap-8 md:flex-row md:justify-end">
            <Button disabled={isPending} onClick={onClose}>
              {t("queue.rejectDialog.cancel")}
            </Button>
            <Button isPending={isPending} onClick={onConfirm} variant="danger">
              {t("queue.rejectDialog.confirm")}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
}
