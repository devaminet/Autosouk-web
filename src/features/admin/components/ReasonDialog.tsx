import { useId, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { TextAreaField } from "../../../components/TextAreaField";
import { useModalDialog } from "../../../hooks/useModalDialog";

const maxReason = 500;

type ReasonDialogProps = {
  open: boolean;
  title: string;
  description: string;
  // What the action does, one line each.
  consequences: string[];
  label: string;
  helper: string;
  confirmLabel: string;
  confirmIcon: IconName;
  isPending: boolean;
  error: string | null;
  onConfirm: (reason: string) => void;
  onClose: () => void;
};

// Asks for the reason before an admin action that needs one, such as
// suspending or deleting. The reason goes to the audit log.
export function ReasonDialog({
  open,
  title,
  description,
  consequences,
  label,
  helper,
  confirmLabel,
  confirmIcon,
  isPending,
  error,
  onConfirm,
  onClose,
}: ReasonDialogProps) {
  const { t } = useTranslation("admin");
  const dialog = useModalDialog(open);
  const titleId = useId();
  const descriptionId = useId();
  const [reason, setReason] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (reason.trim()) {
      onConfirm(reason.trim());
    }
  };

  return (
    <dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className="mt-auto mb-0 w-full max-w-none rounded-t-xl bg-surface p-24 text-ink shadow-overlay backdrop:bg-night/50 md:m-auto md:max-w-dialog md:rounded-xl"
      onCancel={(event) => {
        if (isPending) {
          event.preventDefault();
        }
      }}
      onClose={() => {
        setReason("");
        onClose();
      }}
      ref={dialog}
    >
      {open && (
        <form className="flex flex-col gap-20" noValidate onSubmit={submit}>
          <div className="flex flex-col gap-8">
            <h2 className="type-h3" id={titleId}>
              {title}
            </h2>
            <p className="type-body-s text-ink-2" id={descriptionId}>
              {description}
            </p>
          </div>
          <ul className="flex flex-col gap-8 rounded-lg bg-danger-soft p-16">
            {consequences.map((line) => (
              <li className="flex items-start gap-8 type-body-s text-ink-2" key={line}>
                <Icon className="mt-2 shrink-0 text-danger" name="check" size={16} />
                {line}
              </li>
            ))}
          </ul>
          <TextAreaField
            helper={
              <span className="flex justify-between gap-8">
                <span>{helper}</span>
                <bdi dir="ltr">{t("reason.counter", { count: reason.length, max: maxReason })}</bdi>
              </span>
            }
            label={label}
            maxLength={maxReason}
            onChange={(event) => setReason(event.target.value)}
            required
            rows={3}
            value={reason}
          />
          <div className="empty:hidden" role="alert">
            {error && <Alert tone="danger">{error}</Alert>}
          </div>
          <div className="flex flex-col-reverse gap-8 md:flex-row md:justify-end">
            <Button disabled={isPending} onClick={onClose}>
              {t("reason.cancel")}
            </Button>
            <Button disabled={!reason.trim()} isPending={isPending} type="submit" variant="danger">
              <Icon name={confirmIcon} size={16} />
              {confirmLabel}
            </Button>
          </div>
        </form>
      )}
    </dialog>
  );
}
