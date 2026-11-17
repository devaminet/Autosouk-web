import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { Alert } from "../../../components/Alert";
import { Badge } from "../../../components/Badge";
import type { BadgeTone } from "../../../components/Badge";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { formatDate, formatDayTime, formatNumber } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import { isLocale, localeNames } from "../../../lib/locale";
import { adminVerificationPath, paths } from "../../../lib/paths";
import { actionLabel, actionTone, entryReason } from "../audit";
import { AccountActions } from "../components/AccountActions";
import { AdminPage } from "../components/AdminPage";
import { useAdminUser } from "../hooks";
import type { AdminUser } from "../usersApi";

const listingTones: Record<string, BadgeTone> = {
  draft: "neutral",
  pending: "warning",
  approved: "success",
  withdrawn: "neutral",
  rejected: "danger",
  sold: "info",
};

const faceTones = { not_submitted: "neutral", pending: "warning", approved: "success", rejected: "danger" } as const;

const userIdFrom = (value: string | undefined): number | null => (value && /^\d+$/u.test(value) ? Number(value) : null);

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-12 rounded-xl bg-surface p-24 ring-1 ring-line ring-inset">
      <h2 className="type-h5 text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-8 border-t border-line py-12 first:border-t-0 first:pt-0">
      <dt className="type-body-s text-ink-2">{label}</dt>
      <dd className="type-label-m text-ink">{children}</dd>
    </div>
  );
}

function Checks({ user }: { user: AdminUser }) {
  const { t } = useTranslation(["admin", "enums"]);
  const yes = (ok: boolean) => (
    <span className={`flex items-center gap-4 ${ok ? "text-ink" : "text-muted"}`}>
      <Icon className={ok ? "text-success" : "text-muted"} name={ok ? "check-circle" : "x"} size={16} />
      {t(ok ? "users.detail.verified" : "users.detail.notVerified")}
    </span>
  );
  const alwaysTwoFactor = user.role === "mechanic" || user.role === "admin";
  return (
    <Card title={t("users.detail.checks")}>
      <dl>
        <Row label={t("users.detail.emailVerified")}>{yes(user.isVerified === true)}</Row>
        <Row label={t("users.detail.phoneVerified")}>{yes(user.phoneVerifiedAt !== null)}</Row>
        <Row label={t("users.detail.faceCheck")}>
          <Badge tone={faceTones[user.identityStatus]}>{t(`enums:identity_status.${user.identityStatus}`)}</Badge>
        </Row>
        <Row label={t("users.detail.twoFactor")}>
          {alwaysTwoFactor ? t("users.detail.twoFactorAlways") : t(user.twoFactorEnabled ? "users.detail.on" : "users.detail.off")}
        </Row>
        <Row label={t("users.detail.devices")}>
          <bdi dir="ltr">{formatNumber(user.signedInDevices)}</bdi>
        </Row>
      </dl>
    </Card>
  );
}

function Activity({ user }: { user: AdminUser }) {
  const { t } = useTranslation(["admin", "enums"]);
  const listings = Object.entries(user.listings.byStatus).filter(([, count]) => count > 0);
  return (
    <Card title={t("users.detail.activity")}>
      <dl>
        <Row label={t("users.detail.listings")}>
          {listings.length === 0 ? (
            <span className="text-muted">{t("users.detail.noListings")}</span>
          ) : (
            <span className="flex flex-wrap gap-4">
              {listings.map(([status, count]) => (
                <Badge key={status} tone={listingTones[status] ?? "neutral"}>
                  {t(`enums:listing_status.${status}`)} <bdi dir="ltr">{formatNumber(count)}</bdi>
                </Badge>
              ))}
            </span>
          )}
        </Row>
        <Row label={t("users.detail.inspectionsRequested")}>
          <bdi dir="ltr">{formatNumber(user.inspectionsRequested)}</bdi>
        </Row>
      </dl>
      {listings.length > 0 && (
        <Link
          className="w-fit rounded-xs type-label-s text-brand underline focus-visible:outline-2 focus-visible:outline-brand"
          to={`${paths.adminListings}?sellerId=${user.id}`}
        >
          {t("users.detail.seeListings")}
        </Link>
      )}
    </Card>
  );
}

function Workshop({ mechanic }: { mechanic: NonNullable<AdminUser["mechanic"]> }) {
  const { t } = useTranslation(["admin", "enums"]);
  const { verification } = mechanic;
  const yesNo = (value: boolean) => t(value ? "users.detail.yes" : "users.detail.no");
  return (
    <Card title={t("users.detail.workshop")}>
      <dl>
        <Row label={mechanic.name}>{t(`enums:city.${mechanic.city.slug}`, { defaultValue: mechanic.city.name })}</Row>
        {mechanic.inspectionPrice !== null && (
          <Row label={t("users.detail.price")}>
            <bdi dir="ltr">{t("users.detail.mad", { price: formatNumber(mechanic.inspectionPrice) })}</bdi>
          </Row>
        )}
        {verification && (
          <Row label={t("users.detail.documents")}>
            <Badge tone={verification.status === "approved" ? "success" : verification.status === "pending" ? "warning" : "danger"}>
              {t(`enums:mechanic_verification_status.${verification.status}`)}
            </Badge>
          </Row>
        )}
        <Row label={t("users.detail.bookable")}>{yesNo(verification?.bookable === true)}</Row>
        <Row label={t("users.detail.acceptsRequests")}>{yesNo(mechanic.isActive)}</Row>
        <Row label={t("users.detail.inspections")}>
          <bdi dir="ltr">{formatNumber(mechanic.inspections)}</bdi>
        </Row>
      </dl>
    </Card>
  );
}

function History({ user }: { user: AdminUser }) {
  const { t } = useTranslation("admin");
  const locale = getLocale();
  return (
    <Card title={t("users.detail.history")}>
      {user.history.length === 0 ? (
        <p className="type-body-s text-muted">{t("users.detail.noHistory")}</p>
      ) : (
        <ul className="flex flex-col gap-16">
          {user.history.map((entry) => {
            const reason = entryReason(entry);
            return (
              <li className="flex flex-col gap-4" key={entry.id}>
                <Badge tone={actionTone(entry.action)}>{actionLabel(t, entry.action)}</Badge>
                <span className="type-body-xs text-muted">
                  {[entry.actor ? `${entry.actor.firstName} ${entry.actor.lastName}` : null, formatDayTime(entry.createdAt, locale)]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {reason && (
                  <p className="type-body-s text-ink-2" dir="auto">
                    {reason}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// One account: who it is, its checks, what it did, and what admins did to it.
export function AdminUserPage() {
  const { t } = useTranslation(["admin", "enums"]);
  const userId = userIdFrom(useParams().userId);
  const query = useAdminUser(userId);
  const locale = getLocale();
  const back = { to: paths.adminUsers, label: t("users.detail.back") };

  if (query.isError || userId === null) {
    return (
      <AdminPage back={back} title={t("users.list.title")}>
        <div role="alert">
          <Alert tone="danger">{query.error?.message ?? t("empty")}</Alert>
        </div>
      </AdminPage>
    );
  }
  if (query.isPending) {
    return (
      <AdminPage back={back} title={t("users.list.title")}>
        <output className="type-body-m text-muted">{t("loading")}</output>
      </AdminPage>
    );
  }

  const user = query.data;
  const language = isLocale(user.locale) ? localeNames[user.locale] : user.locale;
  const waitingReview = user.identityStatus === "pending" || user.mechanic?.verification?.status === "pending";

  return (
    <AdminPage
      actions={
        <>
          <Badge tone={user.role === "mechanic" ? "brand" : "neutral"}>{t(`enums:role.${user.role}`)}</Badge>
          {user.suspendedAt ? (
            <Badge tone="danger">{t("users.list.suspended")}</Badge>
          ) : (
            <Badge tone="success">{t("users.list.active")}</Badge>
          )}
        </>
      }
      back={back}
      title={`${user.firstName} ${user.lastName}`}
    >
      {user.suspendedAt && (
        <Alert title={t("users.detail.suspendedOn", { date: formatDayTime(user.suspendedAt, locale) })} tone="danger">
          {user.suspensionReason && <span dir="auto">{t("users.detail.suspendedReason", { reason: user.suspensionReason })}</span>}
        </Alert>
      )}
      <section aria-label={t("users.detail.profile")} className="flex flex-wrap items-center gap-20 rounded-xl bg-surface p-24 ring-1 ring-line ring-inset">
        {user.imageUrl && <img alt="" className="size-64 rounded-full object-cover" src={user.imageUrl} />}
        <dl className="grid flex-1 gap-16 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [t("users.detail.email"), <bdi dir="auto" key="email">{user.email}</bdi>],
            [t("users.detail.phone"), <bdi dir="ltr" key="phone">{user.phone}</bdi>],
            ...(user.city ? [[t("users.detail.city"), t(`enums:city.${user.city.slug}`, { defaultValue: user.city.name })]] : []),
            [t("users.detail.joined"), formatDate(user.createdAt, locale)],
            [t("users.detail.emailsIn"), language],
          ].map(([label, value]) => (
            <div className="flex flex-col gap-2" key={String(label)}>
              <dt className="type-body-xs text-muted">{label}</dt>
              <dd className="type-label-m text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        {waitingReview && (
          <ButtonLink size="s" to={adminVerificationPath(user.id)} variant="dark">
            <Icon name="scan-face" size={16} />
            {t("users.detail.openReview")}
          </ButtonLink>
        )}
      </section>
      <AccountActions user={user} />
      <div className="grid items-start gap-16 lg:grid-cols-3">
        <div className="flex flex-col gap-16 lg:col-span-2">
          <Checks user={user} />
          <Activity user={user} />
          {user.mechanic && <Workshop mechanic={user.mechanic} />}
        </div>
        <History user={user} />
      </div>
    </AdminPage>
  );
}
