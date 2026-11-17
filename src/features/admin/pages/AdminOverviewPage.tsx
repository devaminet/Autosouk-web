import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/Alert";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { formatDayTime, formatNumber } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import type { AuditEntry, Overview } from "../api";
import { actionLabel, actionTone, entryReason, targetLabel } from "../audit";
import { AdminPage } from "../components/AdminPage";
import { AdminTable } from "../components/AdminTable";
import type { Column } from "../components/AdminTable";
import { StatCard } from "../components/StatCard";
import { useAdminOverview, useAuditLog } from "../hooks";

const roles = ["buyer", "seller", "mechanic", "admin"] as const;

// Complete class names, so Tailwind generates them.
const roleBars: Record<(typeof roles)[number], string> = {
  buyer: "[&::-moz-progress-bar]:bg-brand [&::-webkit-progress-value]:bg-brand",
  seller: "[&::-moz-progress-bar]:bg-saffron [&::-webkit-progress-value]:bg-saffron",
  mechanic: "[&::-moz-progress-bar]:bg-success [&::-webkit-progress-value]:bg-success",
  admin: "[&::-moz-progress-bar]:bg-ink-2 [&::-webkit-progress-value]:bg-ink-2",
};

type Queue = { key: string; count: number; icon: IconName; to: string | null };

// What waits for an admin. A queue links to its page once that page exists.
// Pages are added step by step; until then a queue only shows its count.
function Queues({ overview }: { overview: Overview }) {
  const { t } = useTranslation("admin");
  const queues: Queue[] = [
    { key: "verifications", count: overview.queues.verifications, icon: "scan-face", to: null },
    { key: "listings", count: overview.queues.listings, icon: "car", to: null },
  ];

  return (
    <section aria-labelledby="queues-title" className="flex flex-col gap-4 rounded-xl bg-surface p-24 ring-1 ring-line ring-inset">
      <div className="flex items-center justify-between gap-8 pb-8">
        <h2 className="type-h5 text-ink" id="queues-title">
          {t("overview.queues.title")}
        </h2>
        <span className="type-body-xs text-muted">{t("overview.queues.sorted")}</span>
      </div>
      <ul className="flex flex-col divide-y divide-line">
        {queues.map((queue) => (
          <li className="flex items-center gap-12 py-12" key={queue.key}>
            <span
              aria-hidden="true"
              className={`flex size-40 shrink-0 items-center justify-center rounded-md ${queue.count > 0 ? "bg-warning-soft text-warning" : "bg-paper text-muted"}`}
            >
              <Icon name={queue.icon} size={20} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="flex items-center gap-8 type-label-m text-ink">
                {t(`overview.queues.${queue.key}`)}
                <Badge tone={queue.count > 0 ? "warning" : "neutral"}>
                  <bdi dir="ltr">{formatNumber(queue.count)}</bdi>
                </Badge>
              </p>
              <p className="type-body-xs text-muted">{t(`overview.queues.${queue.key}Hint`)}</p>
            </div>
            {queue.to && queue.count > 0 && (
              <ButtonLink size="s" to={queue.to}>
                <Icon className="rtl:-scale-x-100" name="arrow-right" size={16} />
                {t("overview.queues.review")}
              </ButtonLink>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Roles({ overview }: { overview: Overview }) {
  const { t } = useTranslation("admin");
  const total = Math.max(1, overview.users.total);

  return (
    <section aria-labelledby="roles-title" className="flex flex-col gap-16 rounded-xl bg-surface p-24 ring-1 ring-line ring-inset">
      <h2 className="type-h5 text-ink" id="roles-title">
        {t("overview.roles.title")}
      </h2>
      <dl className="flex flex-col gap-12">
        {roles.map((role) => {
          const count = overview.users.byRole[role];
          return (
            <div className="flex flex-col gap-4" key={role}>
              <div className="flex justify-between gap-8 type-body-s">
                <dt className="text-ink-2">{t(`overview.roles.${role}`)}</dt>
                <dd className="type-label-m text-ink">
                  <bdi dir="ltr">{formatNumber(count)}</bdi>
                </dd>
              </div>
              <progress
                aria-hidden="true"
                className={`h-8 w-full appearance-none overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-paper ${roleBars[role]}`}
                max={total}
                value={count}
              />
            </div>
          );
        })}
      </dl>
      {overview.users.suspended > 0 && (
        <p className="flex items-center gap-8 rounded-md bg-danger-soft p-12 type-label-s text-danger">
          <Icon name="lock" size={16} />
          {t("overview.roles.suspended", { count: overview.users.suspended })}
        </p>
      )}
    </section>
  );
}

function Activity() {
  const { t } = useTranslation("admin");
  const log = useAuditLog({ limit: 5 });
  const locale = getLocale();

  const columns: Column<AuditEntry>[] = [
    { header: t("overview.activity.when"), cell: (entry) => formatDayTime(entry.createdAt, locale) },
    {
      header: t("overview.activity.admin"),
      cell: (entry) => (entry.actor ? `${entry.actor.firstName} ${entry.actor.lastName}` : t("overview.activity.system")),
    },
    {
      header: t("overview.activity.action"),
      cell: (entry) => <Badge tone={actionTone(entry.action)}>{actionLabel(t, entry.action)}</Badge>,
    },
    {
      header: t("overview.activity.about"),
      cell: (entry) => {
        const reason = entryReason(entry);
        return (
          <span className="flex flex-col gap-2">
            <span className="text-ink">{targetLabel(t, entry)}</span>
            {reason && (
              <span className="type-body-xs text-muted" dir="auto">
                {reason}
              </span>
            )}
          </span>
        );
      },
    },
  ];

  return (
    <section aria-labelledby="activity-title" className="flex flex-col gap-12">
      <h2 className="type-h4 text-ink" id="activity-title">
        {t("overview.activity.title")}
      </h2>
      {log.isError ? (
        <div role="alert">
          <Alert tone="danger">{log.error.message}</Alert>
        </div>
      ) : log.isPending ? (
        <output className="type-body-m text-muted">{t("loading")}</output>
      ) : (
        <AdminTable
          caption={t("overview.activity.title")}
          columns={columns}
          empty={t("overview.activity.empty")}
          rowKey={(entry) => entry.id}
          rows={log.data.entries}
        />
      )}
    </section>
  );
}

// The admin's home: the site in figures, what waits, and what admins did last.
export function AdminOverviewPage() {
  const { t } = useTranslation("admin");
  const overview = useAdminOverview();

  const content = () => {
    if (overview.isError) {
      return (
        <div className="flex flex-col items-start gap-12" role="alert">
          <Alert tone="danger">{overview.error.message}</Alert>
          <Button onClick={() => void overview.refetch()}>{t("retry")}</Button>
        </div>
      );
    }
    if (overview.isPending) {
      return <output className="type-body-m text-muted">{t("loading")}</output>;
    }
    const data = overview.data;
    const listings = data.listings.byStatus;
    const inspections = data.inspections.byStatus;
    const active = (inspections["pending"] ?? 0) + (inspections["accepted"] ?? 0) + (inspections["in_progress"] ?? 0);
    return (
      <>
        <div className="grid gap-16 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon="users"
            label={t("overview.stats.users")}
            note={t("overview.stats.suspended", { count: data.users.suspended })}
            noteTone={data.users.suspended > 0 ? "danger" : "muted"}
            value={data.users.total}
          />
          <StatCard
            icon="car"
            label={t("overview.stats.listings")}
            note={t("overview.stats.listingsWaiting", { count: data.queues.listings })}
            noteTone={data.queues.listings > 0 ? "warning" : "muted"}
            value={listings["approved"] ?? 0}
          />
          <StatCard
            icon="wrench"
            label={t("overview.stats.mechanics")}
            note={t("overview.stats.mechanicsTotal", { count: data.mechanics.total })}
            value={data.mechanics.bookable}
          />
          <StatCard
            icon="file-check"
            label={t("overview.stats.inspections")}
            note={t("overview.stats.inspectionsActive", { count: active })}
            value={inspections["completed"] ?? 0}
          />
        </div>
        <div className="grid items-start gap-16 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Queues overview={data} />
          </div>
          <Roles overview={data} />
        </div>
      </>
    );
  };

  return (
    <AdminPage description={t("overview.description")} title={t("overview.title")}>
      {content()}
      <Activity />
    </AdminPage>
  );
}
