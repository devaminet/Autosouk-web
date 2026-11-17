import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/Alert";
import { Badge } from "../../../components/Badge";
import type { BadgeTone } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { TextAreaField } from "../../../components/TextAreaField";
import { TextField } from "../../../components/TextField";
import { formatDate } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import { needsDate, rejectionPresets } from "../adminApi";
import type { Decision, Review } from "../adminApi";
import type { MechanicDocument, VerificationStatus } from "../api";
import { useDecideDocuments } from "../hooks";
import { DocumentViewer } from "./DocumentViewer";

type Draft = { decision: "approved" | "rejected" | null; validUntil: string; reason: string };

const emptyDraft: Draft = { decision: null, validUntil: "", reason: "" };

const statusTones: Record<VerificationStatus, BadgeTone> = {
  not_submitted: "neutral",
  pending: "warning",
  approved: "success",
  rejected: "danger",
  expired: "warning",
};

const today = () => new Date().toISOString().slice(0, 10);

type ReviewPanelProps = {
  review: Review;
};

// One mechanic: who they are, their documents, and the admin's decision on
// each document waiting.
export function ReviewPanel({ review }: ReviewPanelProps) {
  const { t } = useTranslation(["documents", "enums"]);
  const decide = useDecideDocuments();
  const pending = review.documents.filter((document) => document.status === "pending");
  const [viewing, setViewing] = useState<MechanicDocument | null>(pending[0] ?? review.documents[0] ?? null);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const checks = review.kind === "garage" ? ["identity", "sameGarage", "validToday", "premises"] : ["identity", "validToday"];
  const [checked, setChecked] = useState<string[]>([]);
  const locale = getLocale();
  const name = review.mechanic?.name ?? `${review.user.firstName} ${review.user.lastName}`;

  const draftOf = (document: MechanicDocument) => drafts[document.id] ?? emptyDraft;
  const update = (document: MechanicDocument, change: Partial<Draft>) =>
    setDrafts((current) => ({ ...current, [document.id]: { ...draftOf(document), ...change } }));

  const isComplete = (document: MechanicDocument) => {
    const draft = draftOf(document);
    if (draft.decision === "approved") {
      return !needsDate(review, document.type) || draft.validUntil !== "";
    }
    return draft.decision === "rejected" && draft.reason.trim() !== "";
  };
  const rejected = pending.filter((document) => draftOf(document).decision === "rejected").length;
  const approving = pending.some((document) => draftOf(document).decision === "approved");
  const ready =
    pending.length > 0 && pending.every(isComplete) && (!approving || checks.every((check) => checked.includes(check)));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const decisions: Decision[] = pending.map((document) => {
      const draft = draftOf(document);
      return draft.decision === "rejected"
        ? { documentId: document.id, decision: "rejected", reason: draft.reason.trim() }
        : {
            documentId: document.id,
            decision: "approved",
            ...(draft.validUntil ? { validUntil: draft.validUntil } : {}),
          };
    });
    decide.mutate({ userId: review.user.id, decisions });
  };

  return (
    <article aria-labelledby="review-title" className="flex flex-col gap-20 rounded-xl bg-surface p-24 ring-1 ring-line ring-inset md:p-32">
      <header className="flex flex-col gap-8">
        <div className="flex flex-wrap gap-8">
          <Badge tone={statusTones[review.status]}>{t(`enums:mechanic_verification_status.${review.status}`)}</Badge>
          {review.kind && <Badge tone="brand">{t(`enums:mechanic_kind.${review.kind}`)}</Badge>}
        </div>
        <h2 className="type-h2 text-ink" id="review-title">
          {name}
        </h2>
        <p className="type-body-s text-muted">
          {[`${review.user.firstName} ${review.user.lastName}`, review.mechanic?.city, review.user.email].filter(Boolean).join(" · ")}
        </p>
        <div className="flex flex-wrap gap-8">
          <Badge tone={review.user.phoneVerified ? "success" : "danger"}>
            {t(review.user.phoneVerified ? "admin.phoneVerified" : "admin.phoneNotVerified")}
          </Badge>
          <Badge tone={review.user.identityStatus === "approved" ? "success" : "danger"}>
            {t("admin.faceCheck", { status: t(`enums:identity_status.${review.user.identityStatus}`) })}
          </Badge>
        </div>
      </header>

      <DocumentViewer document={viewing} />

      <form className="flex flex-col gap-20" noValidate onSubmit={submit}>
        <div className="flex items-center justify-between gap-8">
          <h3 className="type-h5 text-ink">{t("admin.documents")}</h3>
          <span className="type-body-xs text-muted">{t("admin.datesHint")}</span>
        </div>
        <ul className="flex flex-col gap-12">
          {review.documents.map((document) => {
            const label = t(`enums:mechanic_document_type.${document.type}`);
            const draft = draftOf(document);
            const isPending = document.status === "pending";
            return (
              <li className={`flex flex-col gap-12 rounded-lg p-16 ring-1 ring-inset ${viewing?.id === document.id ? "bg-brand-soft/40 ring-brand" : "ring-line"}`} key={document.id}>
                <div className="flex flex-wrap items-center gap-12">
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <p className="type-label-m text-ink">{label}</p>
                    <p className="type-body-xs text-muted">
                      {isPending
                        ? t("admin.waiting")
                        : document.status === "approved" && document.validUntil
                          ? t("tile.validUntil", { date: formatDate(document.validUntil, locale) })
                          : t(`tile.states.${document.status === "approved" && document.expired ? "expired" : document.status}`)}
                    </p>
                  </div>
                  <Button
                    aria-label={t("admin.viewNamed", { document: label })}
                    aria-pressed={viewing?.id === document.id}
                    onClick={() => setViewing(document)}
                    size="s"
                    variant="ghost"
                  >
                    <Icon name="eye" size={16} />
                    {t("admin.view")}
                  </Button>
                </div>
                {isPending && (
                  <fieldset className="flex min-w-0 flex-col gap-12">
                    <legend className="sr-only">{t("admin.decisionFor", { document: label })}</legend>
                    <div className="flex w-fit gap-4 rounded-full bg-paper p-4">
                      {(["approved", "rejected"] as const).map((option) => (
                        // oxlint-disable-next-line jsx-a11y/label-has-associated-control -- the text is nested deeper than the rule checks.
                        <label
                          className={`cursor-pointer rounded-full px-12 py-4 type-label-s has-focus-visible:outline-2 has-focus-visible:outline-brand ${draft.decision === option ? (option === "approved" ? "bg-success text-on-brand" : "bg-danger text-on-brand") : "text-ink-2"}`}
                          key={option}
                        >
                          <input
                            checked={draft.decision === option}
                            className="sr-only"
                            name={`decision-${document.id}`}
                            onChange={() => update(document, { decision: option })}
                            type="radio"
                          />
                          {t(option === "approved" ? "admin.approveOne" : "admin.rejectOne")}
                        </label>
                      ))}
                    </div>
                    {draft.decision === "approved" && needsDate(review, document.type) && (
                      <TextField
                        fieldClassName="max-w-filters"
                        label={t("admin.validUntil")}
                        min={today()}
                        onChange={(event) => update(document, { validUntil: event.target.value })}
                        required
                        type="date"
                        value={draft.validUntil}
                      />
                    )}
                    {draft.decision === "rejected" && (
                      <div className="flex flex-col gap-8 rounded-lg bg-danger-soft p-12">
                        <div className="flex flex-wrap items-center gap-8">
                          <span className="type-body-xs text-muted">{t("admin.presetsLabel")}</span>
                          {rejectionPresets.map((preset) => (
                            <Button key={preset} onClick={() => update(document, { reason: t(`admin.presets.${preset}`) })} size="s">
                              {t(`admin.presetNames.${preset}`)}
                            </Button>
                          ))}
                        </div>
                        <TextAreaField
                          helper={t("admin.reasonHelper")}
                          label={t("admin.reasonFor", { document: label })}
                          maxLength={500}
                          onChange={(event) => update(document, { reason: event.target.value })}
                          required
                          rows={3}
                          value={draft.reason}
                        />
                      </div>
                    )}
                  </fieldset>
                )}
              </li>
            );
          })}
        </ul>

        {pending.length > 0 && (
          <>
            <fieldset className="flex flex-col gap-8">
              <legend className="pb-4 type-label-m text-ink">{t("admin.checklist")}</legend>
              {checks.map((check) => (
                <label className="flex cursor-pointer items-start gap-12 type-body-s text-ink-2" key={check}>
                  <input
                    checked={checked.includes(check)}
                    className="mt-2 size-20 shrink-0 cursor-pointer accent-brand"
                    onChange={(event) =>
                      setChecked((current) =>
                        event.target.checked ? [...current, check] : current.filter((item) => item !== check),
                      )
                    }
                    type="checkbox"
                  />
                  {t(`admin.checks.${check}`)}
                </label>
              ))}
            </fieldset>
            <div className="empty:hidden" role="alert">
              {decide.error && <Alert tone="danger">{decide.error.message}</Alert>}
            </div>
            <div className="flex flex-col gap-12 border-t border-line pt-16">
              <p className="type-body-xs text-muted">{t("admin.footer")}</p>
              <Button
                className="self-start"
                disabled={!ready}
                isPending={decide.isPending}
                size="l"
                type="submit"
                variant={rejected > 0 ? "danger" : "success"}
              >
                <Icon name={rejected > 0 ? "refresh" : "check"} size={18} />
                {rejected > 0 ? t("admin.askAgain", { count: rejected }) : t("admin.approve")}
              </Button>
            </div>
          </>
        )}
        <output className="type-body-s text-success empty:hidden">
          {decide.isSuccess && t("admin.saved", { name: review.user.firstName })}
        </output>
      </form>
    </article>
  );
}
