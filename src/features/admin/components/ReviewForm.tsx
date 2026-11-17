import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { TextAreaField } from "../../../components/TextAreaField";
import { formatDayTime } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import type { MechanicDocument } from "../../documents/api";
import { rejectionPresets } from "../../documents/adminApi";
import { DocumentViewer } from "../../documents/components/DocumentViewer";
import type { useDecideVerification } from "../hooks";
import { facePresets } from "../verificationsApi";
import type { DocumentDecision, Verification } from "../verificationsApi";
import { DocumentDecisionRow } from "./DocumentDecisionRow";
import type { DocumentDraft } from "./DocumentDecisionRow";
import { DecisionSwitch } from "./DecisionSwitch";

type Decision = "approved" | "rejected" | null;

const faceChecks = ["live", "challenges", "clear"] as const;

const emptyDraft: DocumentDraft = { decision: null, validUntil: "", reason: "" };

type ReviewFormProps = {
  review: Verification;
  // Owned by the page, which shows the result once this form is gone.
  decide: ReturnType<typeof useDecideVerification>;
};

// Everything one person sent and waiting for a decision: the face video, and
// a mechanic's documents. One decision covers it all; the API saves it
// together and sends one email.
export function ReviewForm({ review, decide }: ReviewFormProps) {
  const { t } = useTranslation(["admin", "documents", "enums"]);
  const locale = getLocale();
  const { faceCheck } = review;
  const documents = review.documents?.documents ?? [];
  const pending = documents.filter((document) => document.status === "pending");
  const [face, setFace] = useState<{ decision: Decision; reason: string }>({ decision: null, reason: "" });
  const [drafts, setDrafts] = useState<Record<number, DocumentDraft>>({});
  const [checked, setChecked] = useState<string[]>([]);
  const [viewing, setViewing] = useState<MechanicDocument | null>(pending[0] ?? documents[0] ?? null);
  const name = `${review.user.firstName} ${review.user.lastName}`;

  const draftOf = (document: MechanicDocument) => drafts[document.id] ?? emptyDraft;
  const needsDate = (document: MechanicDocument) => review.documents?.expiringTypes.includes(document.type) ?? false;
  const documentChecks =
    pending.length === 0
      ? []
      : ["cinMatches", "validToday", ...(review.documents?.kind === "garage" ? ["sameGarage", "premises"] : [])];
  const checks = [...(faceCheck ? faceChecks : []), ...documentChecks];
  const checkLabel = (check: string) =>
    (faceChecks as readonly string[]).includes(check) || check === "cinMatches"
      ? t(`verifications.review.checklist.${check}`)
      : t(`documents:admin.checks.${check}`);

  const approvingDocuments = pending.some((document) => draftOf(document).decision === "approved");
  const required = [
    ...(face.decision === "approved" ? faceChecks : []),
    ...(approvingDocuments ? documentChecks : []),
  ];
  const faceComplete =
    !faceCheck || face.decision === "approved" || (face.decision === "rejected" && face.reason.trim() !== "");
  const documentComplete = (document: MechanicDocument) => {
    const draft = draftOf(document);
    if (draft.decision === "approved") {
      return !needsDate(document) || draft.validUntil !== "";
    }
    return draft.decision === "rejected" && draft.reason.trim() !== "";
  };
  const ready = faceComplete && pending.every(documentComplete) && required.every((check) => checked.includes(check));
  const rejections =
    (face.decision === "rejected" ? 1 : 0) + pending.filter((document) => draftOf(document).decision === "rejected").length;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ready) {
      return;
    }
    const documentDecisions: DocumentDecision[] = pending.map((document) => {
      const draft = draftOf(document);
      return draft.decision === "rejected"
        ? { documentId: document.id, decision: "rejected", reason: draft.reason.trim() }
        : { documentId: document.id, decision: "approved", ...(draft.validUntil ? { validUntil: draft.validUntil } : {}) };
    });
    decide.mutate({
      userId: review.user.id,
      ...(faceCheck && face.decision
        ? {
            faceCheck:
              face.decision === "rejected" ? { decision: "rejected", reason: face.reason.trim() } : { decision: "approved" },
          }
        : {}),
      ...(pending.length > 0 ? { documents: documentDecisions } : {}),
    });
  };

  return (
    <form className="flex flex-col gap-16" noValidate onSubmit={submit}>
      {faceCheck && (
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
              aria-label={t("verifications.review.face.videoLabel", { name })}
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
          <fieldset className="flex flex-col gap-12">
            <legend className="pb-4 type-label-m text-ink">{t("verifications.review.decision.label")}</legend>
            <DecisionSwitch
              approveLabel={t("verifications.review.decision.approve")}
              name="face-decision"
              onChange={(decision) => setFace((current) => ({ ...current, decision }))}
              rejectLabel={t("verifications.review.decision.reject")}
              value={face.decision}
            />
            {face.decision === "rejected" && (
              <div className="flex flex-col gap-8 rounded-lg bg-danger-soft p-12">
                <div className="flex flex-wrap items-center gap-8">
                  <span className="type-body-xs text-muted">{t("verifications.review.decision.presetsLabel")}</span>
                  {facePresets.map((preset) => (
                    <Button
                      key={preset}
                      onClick={() => setFace((current) => ({ ...current, reason: t(`verifications.review.presets.${preset}`) }))}
                      size="s"
                    >
                      {t(`verifications.review.presetNames.${preset}`)}
                    </Button>
                  ))}
                </div>
                <TextAreaField
                  helper={t("verifications.review.decision.reasonHelper")}
                  label={t("verifications.review.decision.reasonLabel")}
                  maxLength={500}
                  onChange={(event) => setFace((current) => ({ ...current, reason: event.target.value }))}
                  required
                  rows={3}
                  value={face.reason}
                />
              </div>
            )}
          </fieldset>
        </section>
      )}

      {documents.length > 0 && review.documents && (
        <section aria-labelledby="documents-title" className="flex flex-col gap-16 rounded-xl bg-surface p-24 ring-1 ring-line ring-inset">
          <div className="flex flex-wrap items-center justify-between gap-8">
            <h2 className="type-h4 text-ink" id="documents-title">
              {t("documents:admin.documents")}
            </h2>
            <span className="type-body-xs text-muted">
              {[
                review.documents.kind && t(`enums:mechanic_kind.${review.documents.kind}`),
                t("verifications.review.documentsNeeded", { count: review.documents.requiredTypes.length }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
          <DocumentViewer document={viewing} />
          <p className="type-body-xs text-muted">{t("documents:admin.datesHint")}</p>
          <ul className="flex flex-col gap-12">
            {documents.map((document) => (
              <DocumentDecisionRow
                document={document}
                draft={draftOf(document)}
                key={document.id}
                needsDate={needsDate(document)}
                onChange={(change) =>
                  setDrafts((current) => ({ ...current, [document.id]: { ...draftOf(document), ...change } }))
                }
                onView={() => setViewing(document)}
                presets={rejectionPresets}
                viewing={viewing?.id === document.id}
              />
            ))}
          </ul>
        </section>
      )}

      {(faceCheck || pending.length > 0) && (
        <section className="flex flex-col gap-16 rounded-xl bg-surface p-24 ring-1 ring-line ring-inset">
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
                {checkLabel(check)}
              </label>
            ))}
          </fieldset>
          <div className="empty:hidden" role="alert">
            {decide.error && <Alert tone="danger">{decide.error.message}</Alert>}
          </div>
          <div className="flex flex-col gap-12 border-t border-line pt-16">
            <p className="type-body-xs text-muted">{t("verifications.review.decision.footerAll", { name: review.user.firstName })}</p>
            <Button
              className="self-start"
              disabled={!ready}
              isPending={decide.isPending}
              size="l"
              type="submit"
              variant={rejections > 0 ? "danger" : "success"}
            >
              <Icon name={rejections > 0 ? "refresh" : "check"} size={18} />
              {rejections > 0
                ? t("verifications.review.decision.askAgain", { count: rejections })
                : t("verifications.review.decision.approveAll")}
            </Button>
          </div>
        </section>
      )}
    </form>
  );
}
