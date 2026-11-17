import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { Alert } from "../../../components/Alert";
import { Badge } from "../../../components/Badge";
import { Icon } from "../../../components/Icon";
import { formatDate, formatDayTime } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import { isLocale, localeNames } from "../../../lib/locale";
import { paths } from "../../../lib/paths";
import { AdminPage } from "../components/AdminPage";
import { ReviewForm } from "../components/ReviewForm";
import { useDecideVerification, useVerification } from "../hooks";
import type { Verification } from "../verificationsApi";

const userIdFrom = (value: string | undefined): number | null => (value && /^\d+$/u.test(value) ? Number(value) : null);

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <dt className="type-body-xs text-muted">{label}</dt>
      <dd className="type-label-m text-ink">{children}</dd>
    </div>
  );
}

function Checked({ ok, children }: { ok: boolean; children: ReactNode }) {
  const { t } = useTranslation("admin");
  return (
    <span className="flex items-center gap-4">
      <Icon className={ok ? "text-success" : "text-muted"} name={ok ? "check-circle" : "x"} size={14} />
      <bdi dir="auto">{children}</bdi>
      <span className="sr-only">({t(ok ? "verifications.review.verified" : "verifications.review.notVerified")})</span>
    </span>
  );
}

// Who sent it: the account, its checks and its earlier attempts.
function Profile({ review }: { review: Verification }) {
  const { t } = useTranslation(["admin", "enums"]);
  const { user } = review;
  const language = isLocale(user.locale) ? localeNames[user.locale] : user.locale;
  return (
    <section aria-label={t("verifications.review.profile")} className="rounded-xl bg-surface p-20 ring-1 ring-line ring-inset">
      <dl className="grid gap-16 sm:grid-cols-2 lg:grid-cols-3">
        <Fact label={t("verifications.review.email")}>
          <Checked ok={user.emailVerified === true}>{user.email}</Checked>
        </Fact>
        <Fact label={t("verifications.review.phone")}>
          <Checked ok={user.phoneVerifiedAt !== null}>
            <span dir="ltr">{user.phone}</span>
          </Checked>
        </Fact>
        {user.city && (
          <Fact label={t("verifications.review.city")}>{t(`enums:city.${user.city.slug}`, { defaultValue: user.city.name })}</Fact>
        )}
        <Fact label={t("verifications.review.signedUp")}>{formatDate(user.createdAt, getLocale())}</Fact>
        <Fact label={t("verifications.review.emailsIn")}>{language}</Fact>
        <Fact label={t("verifications.review.faceVideos")}>
          {t("verifications.review.attempts", { rejected: review.attempts.rejected, max: review.attempts.max })}
        </Fact>
      </dl>
    </section>
  );
}

function History({ review }: { review: Verification }) {
  const { t } = useTranslation("admin");
  const locale = getLocale();
  return (
    <section aria-labelledby="history-title" className="flex flex-col gap-12 rounded-xl bg-surface p-24 ring-1 ring-line ring-inset">
      <h2 className="type-h5 text-ink" id="history-title">
        {t("verifications.review.history.title")}
      </h2>
      {review.faceCheckHistory.length === 0 ? (
        <p className="type-body-s text-muted">{t("verifications.review.history.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-12">
          {review.faceCheckHistory.map((check) => (
            <li className="flex flex-col gap-4" key={check.id}>
              <span className="flex flex-wrap items-center gap-8">
                <Badge tone={check.status === "approved" ? "success" : "danger"}>
                  {t(`verifications.review.history.${check.status}`)}
                </Badge>
                {check.reviewedAt && (
                  <span className="type-body-xs text-muted">
                    {t("verifications.review.history.decided", { time: formatDayTime(check.reviewedAt, locale) })}
                  </span>
                )}
              </span>
              {check.rejectionReason && (
                <p className="type-body-s text-ink-2" dir="auto">
                  {check.rejectionReason}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Everything one person sent to be verified, and the decision on it.
export function AdminVerificationPage() {
  const { t } = useTranslation(["admin", "enums"]);
  const userId = userIdFrom(useParams().userId);
  const review = useVerification(userId);
  const decide = useDecideVerification();
  const back = { to: paths.adminVerifications, label: t("verifications.review.back") };

  if (review.isError || userId === null) {
    return (
      <AdminPage back={back} title={t("verifications.queue.title")}>
        <div role="alert">
          <Alert tone="danger">{review.error?.message ?? t("empty")}</Alert>
        </div>
      </AdminPage>
    );
  }
  if (review.isPending) {
    return (
      <AdminPage back={back} title={t("verifications.queue.title")}>
        <output className="type-body-m text-muted">{t("loading")}</output>
      </AdminPage>
    );
  }

  const data = review.data;
  const { user } = data;
  const name = `${user.firstName} ${user.lastName}`;
  const pendingDocuments = data.documents?.documents.filter((document) => document.status === "pending").length ?? 0;

  return (
    <AdminPage
      actions={
        <>
          <Badge tone={user.role === "mechanic" ? "brand" : "neutral"}>{t(`enums:role.${user.role}`)}</Badge>
          {data.faceCheck && <Badge tone="info">{t("verifications.review.waitingFace")}</Badge>}
          {pendingDocuments > 0 && (
            <Badge tone="brand">{t("verifications.review.waitingDocuments", { count: pendingDocuments })}</Badge>
          )}
          {!data.faceCheck && pendingDocuments === 0 && <Badge tone="success">{t("verifications.review.nothingWaiting")}</Badge>}
        </>
      }
      back={back}
      title={name}
    >
      {user.suspendedAt && (
        <Alert tone="danger">{t("verifications.review.suspended")}</Alert>
      )}
      <output className="empty:hidden">
        {decide.isSuccess && <Alert tone="success">{t("verifications.review.decision.saved", { name: user.firstName })}</Alert>}
      </output>
      <Profile review={data} />
      <div className="grid items-start gap-16 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {data.faceCheck || pendingDocuments > 0 ? (
            // A fresh form for each review, so decisions don't carry over.
            <ReviewForm decide={decide} key={data.faceCheck?.id ?? `documents-${user.id}`} review={data} />
          ) : (
            <p className="rounded-xl bg-surface p-24 type-body-m text-muted ring-1 ring-line ring-inset">
              {t("verifications.review.face.noVideo")}
            </p>
          )}
        </div>
        <History review={data} />
      </div>
    </AdminPage>
  );
}
