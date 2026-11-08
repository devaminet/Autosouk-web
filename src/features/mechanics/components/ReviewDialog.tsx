import { useId, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/Button";
import { FormErrors } from "../../../components/FormErrors";
import { Icon } from "../../../components/Icon";
import { TextAreaField } from "../../../components/TextAreaField";
import { useModalDialog } from "../../../hooks/useModalDialog";
import { fieldError } from "../../../lib/api/errors";
import { formatNumber } from "../../../lib/format";
import type { Review } from "../api";
import { useSaveReview } from "../hooks";
import { GarageAvatar } from "./GarageAvatar";

type ReviewDialogProps = {
  open: boolean;
  onClose: () => void;
  garage: { id: number; name: string; logo: string | null };
  // The buyer's review to change, or null to write one.
  review: Review | null;
};

// As the API allows.
const maxLength = 1000;

const ratings = [1, 2, 3, 4, 5] as const;

type Rating = (typeof ratings)[number];

const ratingWords: Record<Rating, string> = {
  1: "review.ratings.1",
  2: "review.ratings.2",
  3: "review.ratings.3",
  4: "review.ratings.4",
  5: "review.ratings.5",
};

const fields = ["rating", "message"] as const;

const closeClass =
  "flex size-40 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface text-brand ring-1 ring-line ring-inset hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed";

// Writes the buyer's review of a workshop, or changes it. A sheet on small
// screens and a centred modal on wide ones.
export function ReviewDialog({ open, onClose, garage, review }: ReviewDialogProps) {
  const dialog = useModalDialog(open);
  const titleId = useId();
  const isNew = review === null;
  const save = useSaveReview(garage.id, isNew);

  const close = () => {
    onClose();
    save.reset();
  };

  return (
    <dialog
      aria-labelledby={titleId}
      className="mt-auto mb-0 w-full max-w-none rounded-t-2xl bg-surface p-24 text-ink shadow-overlay backdrop:bg-night/50 md:m-auto md:max-w-dialog md:rounded-2xl md:p-32"
      onCancel={(event) => {
        // The review can't be called back, so stay open until it is saved.
        if (save.isPending) {
          event.preventDefault();
        }
      }}
      onClose={close}
      ref={dialog}
    >
      {open && <ReviewForm close={close} garage={garage} review={review} save={save} titleId={titleId} />}
    </dialog>
  );
}

type ReviewFormProps = {
  close: () => void;
  garage: ReviewDialogProps["garage"];
  review: Review | null;
  save: ReturnType<typeof useSaveReview>;
  titleId: string;
};

// Mounted each time the dialog opens, so it starts from the saved review.
function ReviewForm({ close, garage, review, save, titleId }: ReviewFormProps) {
  const { t } = useTranslation("mechanics");
  const [rating, setRating] = useState<Rating | null>(() => ratings.find((value) => value === review?.rating) ?? null);
  const [message, setMessage] = useState(review?.message ?? "");
  const [missingRating, setMissingRating] = useState(false);
  const ratingErrorId = useId();
  const ratingError = missingRating ? t("review.ratingRequired") : fieldError(save.error, "rating");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (rating === null) {
      setMissingRating(true);
      return;
    }
    save.mutate({ rating, message }, { onSuccess: close });
  };

  return (
    <form className="flex flex-col gap-24" noValidate onSubmit={submit}>
      <header className="flex items-start gap-16">
        <GarageAvatar logo={garage.logo} name={garage.name} size="l" />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <p className="type-overline text-muted">{t("review.overline")}</p>
          <h2 className="truncate type-h3 text-ink" dir="auto" id={titleId}>
            {garage.name}
          </h2>
        </div>
        <button aria-label={t("review.close")} className={closeClass} disabled={save.isPending} onClick={close} type="button">
          <Icon name="x" size={18} />
        </button>
      </header>
      <fieldset aria-describedby={ratingError ? ratingErrorId : undefined} className="flex flex-col gap-12">
        <legend className="pb-12 type-label-m text-ink">{t("review.question")}</legend>
        <div className="flex flex-wrap items-center gap-16">
          <div className="flex gap-4">
            {ratings.map((value) => (
              <label
                className="cursor-pointer rounded-xs has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand"
                key={value}
              >
                <input
                  checked={rating === value}
                  className="sr-only"
                  name="rating"
                  onChange={() => {
                    setRating(value);
                    setMissingRating(false);
                  }}
                  type="radio"
                  value={value}
                />
                <span className="sr-only">{t(ratingWords[value])}</span>
                <Icon
                  className={rating !== null && value <= rating ? "fill-current text-saffron" : "text-line-strong"}
                  name="star"
                  size={40}
                />
              </label>
            ))}
          </div>
          {rating !== null && <p className="type-h4 text-ink">{t(ratingWords[rating])}</p>}
        </div>
        {ratingError && (
          <p className="type-body-xs text-danger" id={ratingErrorId}>
            {ratingError}
          </p>
        )}
      </fieldset>
      <TextAreaField
        dir="auto"
        error={fieldError(save.error, "message")}
        helper={
          <span className="flex items-start justify-between gap-16">
            <span>{t("review.helper")}</span>
            <bdi className="shrink-0 type-mono-s" dir="ltr">
              {formatNumber(message.length)} / {formatNumber(maxLength)}
            </bdi>
          </span>
        }
        label={t("review.message")}
        maxLength={maxLength}
        onChange={(event) => setMessage(event.target.value)}
        rows={5}
        value={message}
      />
      <FormErrors error={save.error} fields={fields} />
      <div className="flex flex-col-reverse gap-8 md:flex-row md:items-center md:justify-between">
        <Button disabled={save.isPending} onClick={close} variant="ghost">
          {t("review.cancel")}
        </Button>
        <Button isPending={save.isPending} size="l" type="submit" variant="primary">
          <Icon name="check-circle" size={18} />
          {t(review ? "review.saveChanges" : "review.publish")}
        </Button>
      </div>
    </form>
  );
}
