import { useTranslation } from "react-i18next";
import { Badge } from "../../../components/Badge";
import type { BadgeTone } from "../../../components/Badge";
import { ButtonLink } from "../../../components/ButtonLink";
import { formatDate } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import { paths } from "../../../lib/paths";
import type { VerificationStatus } from "../api";
import { useVerification } from "../hooks";

const tones: Record<VerificationStatus, BadgeTone> = {
  not_submitted: "neutral",
  pending: "info",
  approved: "success",
  rejected: "danger",
  expired: "warning",
};

// Reminders start this many days before a document ends.
const soonDays = 30;

const daysUntil = (date: string, now = new Date()) =>
  Math.ceil((Date.parse(`${date}T00:00:00Z`) - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) / 86_400_000);

// Where the mechanic stands with their documents, on the workshop page.
export function DocumentsSection() {
  const { t } = useTranslation(["documents", "enums"]);
  const verification = useVerification();

  if (!verification.data) {
    return null;
  }
  const { status, validUntil } = verification.data;
  const days = status === "approved" && validUntil ? daysUntil(validUntil) : null;
  const soon = days !== null && days <= soonDays;

  const message = () => {
    if (soon) {
      return t("section.expiresSoon", { count: Math.max(days, 0) });
    }
    if (status === "approved" && validUntil) {
      return t("section.approvedUntil", { date: formatDate(validUntil, getLocale()) });
    }
    return t(`section.${status === "not_submitted" ? "notSubmitted" : status}`);
  };

  return (
    <section
      aria-labelledby="documents-section-title"
      className={`flex flex-col gap-16 rounded-xl p-24 ring-1 ring-inset sm:flex-row sm:items-center ${soon || status === "expired" ? "bg-warning-soft ring-warning" : "bg-surface ring-line"}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-8">
          <h2 className="type-h4 text-ink" id="documents-section-title">
            {t("section.title")}
          </h2>
          <Badge tone={tones[status]}>{t(`enums:mechanic_verification_status.${status}`)}</Badge>
        </div>
        <p className="type-body-s text-ink-2">{message()}</p>
      </div>
      <ButtonLink
        className="self-start sm:self-auto"
        to={paths.mechanicDocuments}
        variant={status === "approved" && !soon ? "secondary" : "primary"}
      >
        {t(status === "not_submitted" ? "section.start" : "section.open")}
      </ButtonLink>
    </section>
  );
}
