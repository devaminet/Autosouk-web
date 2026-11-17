import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { PageTitle } from "../../../components/PageTitle";
import { formatDate } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import { paths } from "../../../lib/paths";
import { AuthCard } from "../../auth/components/AuthCard";
import { AuthHeading } from "../../auth/components/AuthHeading";
import { AuthShell } from "../../auth/components/AuthShell";
import { IconCircle } from "../../auth/components/IconCircle";
import { StepAction } from "../../identity/components/StepAction";
import { currentDocuments, hasDrafts, isKindLocked, isReady } from "../api";
import type { Verification, VerificationStatus } from "../api";
import { DocumentTile } from "../components/DocumentTile";
import { KindChoice } from "../components/KindChoice";
import { useSubmitDocuments, useVerification } from "../hooks";

const headings: Record<VerificationStatus, { icon: IconName; tone: "brand" | "success" | "warning" | "danger" }> = {
  not_submitted: { icon: "file", tone: "brand" },
  pending: { icon: "clock", tone: "brand" },
  approved: { icon: "check-circle", tone: "success" },
  rejected: { icon: "alert-octagon", tone: "danger" },
  expired: { icon: "clock", tone: "warning" },
};

type DocumentsProps = {
  verification: Verification;
  onChangeKind: () => void;
};

function Documents({ verification, onChangeKind }: DocumentsProps) {
  const { t } = useTranslation("documents");
  const submit = useSubmitDocuments();
  const current = currentDocuments(verification);
  const required = verification.requiredTypes;
  const ready = required.filter((type) => isReady(current.get(type))).length;
  const drafts = hasDrafts(verification);
  const { status } = verification;
  // Sending is offered while something is left to send.
  const canSend = drafts || status === "not_submitted" || status === "rejected" || status === "expired";
  const heading = headings[status];
  const kind = verification.kind ?? "solo";

  const description = () => {
    if (status === "approved" && verification.validUntil) {
      return t("approved.description", { date: formatDate(verification.validUntil, getLocale()) });
    }
    if (status === "approved") {
      return t("approved.descriptionNoDate");
    }
    return t(status === "not_submitted" ? `notSubmitted.${kind}Description` : `${status}.description`);
  };

  return (
    <>
      <IconCircle name={status === "not_submitted" && kind === "solo" ? "id-card" : heading.icon} tone={heading.tone} />
      <AuthHeading
        description={description()}
        title={t(status === "not_submitted" ? `notSubmitted.${kind}Title` : `${status}.title`)}
      />
      {canSend && (
        <div className="flex w-full flex-col gap-8 text-start">
          <div className="flex items-center justify-between gap-12">
            <span className="type-label-s text-ink">{t("progress.label")}</span>
            <span className="type-body-xs text-muted">{t("progress.count", { ready, total: required.length })}</span>
          </div>
          <progress
            aria-label={t("progress.label")}
            className="h-8 w-full appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:bg-brand [&::-webkit-progress-bar]:bg-line [&::-webkit-progress-value]:bg-brand"
            max={required.length}
            value={ready}
          />
        </div>
      )}
      <ul aria-label={t("listLabel")} className="flex w-full flex-col gap-12 text-start">
        {required.map((type) => (
          <DocumentTile document={current.get(type)} key={type} type={type} />
        ))}
      </ul>
      {status === "pending" && !drafts && (
        <div className="w-full text-start">
          <Alert title={t("pending.whileYouWait")} tone="info">
            {t("pending.whileYouWaitDescription")}
          </Alert>
        </div>
      )}
      <ul className="flex w-full flex-col gap-8 rounded-lg bg-surface-2 p-16 text-start">
        <li className="flex items-center gap-8 type-body-xs text-ink-2">
          <Icon name="camera" size={16} />
          {t("tips.readable")}
        </li>
        <li className="flex items-center gap-8 type-body-xs text-ink-2">
          <Icon name="lock" size={16} />
          {t("privacy")}
        </li>
      </ul>
      <div className="w-full empty:hidden" role="alert">
        {submit.error && <Alert tone="danger">{submit.error.message}</Alert>}
      </div>
      <div className="flex w-full flex-col items-center gap-12">
        {canSend ? (
          <Button
            block
            disabled={ready < required.length || !drafts}
            isPending={submit.isPending}
            onClick={() => submit.mutate()}
            size="l"
            variant="primary"
          >
            {t(status === "not_submitted" ? "send" : "sendAgain")}
          </Button>
        ) : (
          <ButtonLink block size="l" to={paths.workshop} variant="dark">
            <Icon name="wrench" size={18} />
            {t("workshop")}
          </ButtonLink>
        )}
        {!isKindLocked(verification) && (
          <Button onClick={onChangeKind} variant="ghost">
            {t(kind === "solo" ? "switchToGarage" : "switchToSolo")}
          </Button>
        )}
      </div>
    </>
  );
}

// The documents a mechanic sends so buyers can book them: solo or garage,
// then each file. An admin checks them by hand.
export function MechanicDocumentsPage() {
  const { t } = useTranslation("documents");
  const verification = useVerification();
  const [choosing, setChoosing] = useState(false);

  const content = () => {
    if (verification.isError) {
      return (
        <div className="flex w-full flex-col items-start gap-12" role="alert">
          <Alert tone="danger">{verification.error.message}</Alert>
          <Button onClick={() => void verification.refetch()}>{t("retry")}</Button>
        </div>
      );
    }
    if (verification.isPending) {
      return <output className="type-body-m text-muted">{t("common:loading")}</output>;
    }
    const data = verification.data;
    if (data.kind === null || choosing) {
      return (
        <>
          <IconCircle name="wrench" tone="brand" />
          <AuthHeading description={t("kind.description")} title={t("kind.title")} />
          <KindChoice current={data.kind} onChosen={() => setChoosing(false)} />
        </>
      );
    }
    return <Documents onChangeKind={() => setChoosing(true)} verification={data} />;
  };

  return (
    <AuthShell action={<StepAction step={t("step")} />}>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <AuthCard centered wide>
        {content()}
      </AuthCard>
    </AuthShell>
  );
}
