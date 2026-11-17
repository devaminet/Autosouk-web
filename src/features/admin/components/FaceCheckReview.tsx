import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { TextAreaField } from "../../../components/TextAreaField";
import { formatDayTime } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import type { useDecideVerification } from "../hooks";
import { facePresets } from "../verificationsApi";
import type { Verification } from "../verificationsApi";

const checks = ["live", "challenges", "clear"] as const;

type FaceCheckReviewProps = {
  review: Verification;
  faceCheck: NonNullable<Verification["faceCheck"]>;
  // Documents also wait, and the API takes both decisions together.
  blocked: boolean;
  // Owned by the page, which shows the result once this form is gone.
  decide: ReturnType<typeof useDecideVerification>;
};

// The face video, the challenges asked, and the admin's decision on it.
export function FaceCheckReview({ review, faceCheck, blocked, decide }: FaceCheckReviewProps) {
  const { t } = useTranslation(["admin", "enums"]);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [reason, setReason] = useState("");
  const [checked, setChecked] = useState<string[]>([]);
  const locale = getLocale();

  const ready =
    !blocked &&
    (decision === "approved"
      ? checks.every((check) => checked.includes(check))
      : decision === "rejected" && reason.trim() !== "");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ready || decision === null) {
      return;
    }
    decide.mutate({
      userId: review.user.id,
      faceCheck: decision === "rejected" ? { decision, reason: reason.trim() } : { decision },
    });
  };

  return (
    <section aria-labelledby="face-title" className="flex flex-col gap-20 rounded-xl bg-surface p-24 ring-1 ring-line ring-inset">
      <div className="flex flex-wrap items-center justify-between gap-8">
        <h2 className="type-h4 text-ink" id="face-title">
          {t("verifications.review.face.title")}
        </h2>
        {faceCheck.submittedAt && (
          <span className="type-body-xs text-muted">
            {t("verifications.review.face.sent", { time: formatDayTime(faceCheck.submittedAt, locale) })}
          </span>
        )}
      </div>
      <figure className="flex flex-col gap-8">
        {/* oxlint-disable-next-line jsx-a11y/media-has-caption -- a silent face recording, with nothing to caption. */}
        <video
          aria-label={t("verifications.review.face.videoLabel", { name: `${review.user.firstName} ${review.user.lastName}` })}
          className="aspect-video w-full rounded-lg bg-night object-contain"
          controls
          preload="metadata"
          src={faceCheck.videoUrl}
        />
        <figcaption className="flex flex-wrap items-center gap-8 type-body-xs text-muted">
          <Icon name="eye" size={14} />
          {t("verifications.review.face.logged")} · {t("verifications.review.face.linkValid")}
        </figcaption>
      </figure>
      <div className="flex flex-col gap-8">
        <h3 className="type-label-m text-ink" id="challenges-title">
          {t("verifications.review.face.challenges")}
        </h3>
        <ol aria-labelledby="challenges-title" className="flex flex-wrap gap-8">
          {faceCheck.challenges.map((challenge, index) => (
            <li className="flex items-center gap-8 rounded-md bg-paper px-12 py-8 type-label-s text-ink" key={`${challenge}-${index}`}>
              <span aria-hidden="true" className="flex size-20 items-center justify-center rounded-full bg-night type-label-s text-surface">
                {index + 1}
              </span>
              {t(`enums:identity_challenge.${challenge}`)}
            </li>
          ))}
        </ol>
        <p className="type-body-xs text-muted">{t("verifications.review.face.challengesHint")}</p>
      </div>
      <form className="flex flex-col gap-20" noValidate onSubmit={submit}>
        <fieldset className="flex flex-col gap-8">
          <legend className="pb-4 type-label-m text-ink">{t("verifications.review.checklist.title")}</legend>
          {checks.map((check) => (
            <label className="flex cursor-pointer items-start gap-12 type-body-s text-ink-2" key={check}>
              <input
                checked={checked.includes(check)}
                className="mt-2 size-20 shrink-0 cursor-pointer accent-brand"
                onChange={(event) =>
                  setChecked((current) => (event.target.checked ? [...current, check] : current.filter((item) => item !== check)))
                }
                type="checkbox"
              />
              {t(`verifications.review.checklist.${check}`)}
            </label>
          ))}
        </fieldset>
        <fieldset className="flex flex-col gap-12">
          <legend className="pb-4 type-label-m text-ink">{t("verifications.review.decision.label")}</legend>
          <div className="flex w-fit gap-4 rounded-full bg-paper p-4">
            {(["approved", "rejected"] as const).map((option) => (
              // oxlint-disable-next-line jsx-a11y/label-has-associated-control -- the text is nested deeper than the rule checks.
              <label
                className={`cursor-pointer rounded-full px-16 py-8 type-label-s has-focus-visible:outline-2 has-focus-visible:outline-brand ${decision === option ? (option === "approved" ? "bg-success text-on-brand" : "bg-danger text-on-brand") : "text-ink-2"}`}
                key={option}
              >
                <input
                  checked={decision === option}
                  className="sr-only"
                  name="face-decision"
                  onChange={() => setDecision(option)}
                  type="radio"
                />
                {t(option === "approved" ? "verifications.review.decision.approve" : "verifications.review.decision.reject")}
              </label>
            ))}
          </div>
          {decision === "rejected" && (
            <div className="flex flex-col gap-8 rounded-lg bg-danger-soft p-12">
              <div className="flex flex-wrap items-center gap-8">
                <span className="type-body-xs text-muted">{t("verifications.review.decision.presetsLabel")}</span>
                {facePresets.map((preset) => (
                  <Button key={preset} onClick={() => setReason(t(`verifications.review.presets.${preset}`))} size="s">
                    {t(`verifications.review.presetNames.${preset}`)}
                  </Button>
                ))}
              </div>
              <TextAreaField
                helper={t("verifications.review.decision.reasonHelper")}
                label={t("verifications.review.decision.reasonLabel")}
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                required
                rows={3}
                value={reason}
              />
            </div>
          )}
        </fieldset>
        <div className="empty:hidden" role="alert">
          {decide.error && <Alert tone="danger">{decide.error.message}</Alert>}
        </div>
        <div className="flex flex-col gap-12 border-t border-line pt-16">
          <p className="type-body-xs text-muted">{t("verifications.review.decision.footer")}</p>
          <Button
            className="self-start"
            disabled={!ready}
            isPending={decide.isPending}
            size="l"
            type="submit"
            variant={decision === "rejected" ? "danger" : "success"}
          >
            <Icon name={decision === "rejected" ? "x" : "check"} size={18} />
            {t(decision === "rejected" ? "verifications.review.decision.rejectSubmit" : "verifications.review.decision.approveSubmit")}
          </Button>
        </div>
      </form>
    </section>
  );
}
