import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Alert } from "../../../components/Alert";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { Pagination } from "../../../components/Pagination";
import { SelectField } from "../../../components/SelectField";
import { formatDayTime, formatNumber } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import { adminUserPath, listingPath } from "../../../lib/paths";
import type { AuditEntry } from "../api";
import { actionLabel, actionTone, entryKept, entryReason, knownTargets, targetLabel } from "../audit";
import { AdminPage } from "../components/AdminPage";
import { AdminTable } from "../components/AdminTable";
import type { Column } from "../components/AdminTable";
import { useAuditLog } from "../hooks";
import { useListParams } from "../listParams";

const filterKeys = ["action", "targetType", "targetId", "actorId"] as const;

const linkClass =
  "rounded-xs text-ink-2 underline hover:text-ink focus-visible:outline-2 focus-visible:outline-brand";

// One filter in effect, with a button that removes it.
function FilterBanner({ children, clear, onClear }: { children: ReactNode; clear: string; onClear: () => void }) {
  return (
    <p className="flex flex-wrap items-center gap-12 type-label-m text-ink">
      <span dir="auto">{children}</span>
      <Button onClick={onClear} size="s" variant="ghost">
        <Icon name="x" size={14} />
        {clear}
      </Button>
    </p>
  );
}

// Where the entry's target can be opened, while it still exists.
const targetPath = (entry: AuditEntry): string | null => {
  if (entry.action.endsWith(".deleted")) {
    return null;
  }
  if (entry.targetType === "user") {
    return adminUserPath(entry.targetId);
  }
  if (entry.targetType === "listing") {
    return listingPath(entry.targetId);
  }
  return null;
};

// Who saw or decided what, newest first, with filters kept in the link.
export function AdminAuditLogPage() {
  const { t } = useTranslation("admin");
  const { page, values, set, hrefFor } = useListParams(filterKeys);
  const log = useAuditLog({ page, ...values });
  const locale = getLocale();
  const entries = log.data?.entries ?? [];

  // The link to this list with some filters changed, the others kept.
  const withValues = (changes: Partial<Record<(typeof filterKeys)[number], string>>) => {
    const params = new URLSearchParams(hrefFor(1).slice(1));
    for (const [key, value] of Object.entries(changes)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    const query = params.toString();
    return query ? `?${query}` : "?";
  };

  const columns: Column<AuditEntry>[] = [
    {
      header: t("auditLog.when"),
      cell: (entry) => <span className="whitespace-nowrap">{formatDayTime(entry.createdAt, locale)}</span>,
    },
    {
      header: t("auditLog.admin"),
      cell: ({ actor }) =>
        actor ? (
          <Link
            aria-label={t("auditLog.byAdminNamed", { name: `${actor.firstName} ${actor.lastName}` })}
            className={linkClass}
            dir="auto"
            to={withValues({ actorId: String(actor.id) })}
          >
            {actor.firstName} {actor.lastName}
          </Link>
        ) : (
          <span className="text-muted">{t("auditLog.system")}</span>
        ),
    },
    {
      header: t("auditLog.action"),
      cell: (entry) => <Badge tone={actionTone(entry.action)}>{actionLabel(t, entry.action)}</Badge>,
    },
    {
      header: t("auditLog.about"),
      cell: (entry) => {
        const path = targetPath(entry);
        const label = targetLabel(t, entry);
        return (
          <span className="flex flex-col items-start gap-2">
            {path ? (
              <Link className={linkClass} to={path}>
                {label}
              </Link>
            ) : (
              <span className="text-ink">{label}</span>
            )}
            <Link
              className="rounded-xs type-body-xs text-muted underline hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
              to={withValues({ targetType: entry.targetType, targetId: String(entry.targetId) })}
            >
              {t("auditLog.allAbout", { target: label })}
            </Link>
          </span>
        );
      },
    },
    {
      header: t("auditLog.details"),
      cell: (entry) => {
        const reason = entryReason(entry);
        const kept = entryKept(t, entry, locale);
        if (!reason && !kept) {
          return <span className="text-muted">—</span>;
        }
        return (
          <span className="flex max-w-filters flex-col gap-2">
            {kept && (
              <span className="type-body-s text-ink" dir="auto">
                {kept}
              </span>
            )}
            {reason && (
              <span className="type-body-xs text-muted" dir="auto">
                {t("auditLog.reason", { reason })}
              </span>
            )}
          </span>
        );
      },
    },
  ];

  const content = () => {
    if (log.isError) {
      return (
        <div className="flex flex-col items-start gap-12" role="alert">
          <Alert tone="danger">{log.error.message}</Alert>
          <Button onClick={() => void log.refetch()}>{t("retry")}</Button>
        </div>
      );
    }
    if (log.isPending) {
      return <output className="type-body-m text-muted">{t("loading")}</output>;
    }
    const { meta } = log.data;
    const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
    return (
      <>
        <AdminTable
          caption={t("auditLog.caption")}
          columns={columns}
          empty={t("auditLog.empty")}
          rowKey={(entry) => entry.id}
          rows={entries}
        />
        <div className="flex flex-wrap items-center justify-between gap-12">
          <p className="type-body-s text-muted">
            <bdi dir="ltr">
              {t("auditLog.range", {
                from: formatNumber(from),
                to: formatNumber(Math.min(meta.page * meta.limit, meta.total)),
                total: formatNumber(meta.total),
              })}
            </bdi>
          </p>
          <Pagination hrefFor={hrefFor} page={meta.page} totalPages={meta.totalPages} />
        </div>
      </>
    );
  };

  // The admin's name comes from the rows, which all share the filtered admin.
  const actor = entries.find((entry) => entry.actor)?.actor;
  const target =
    values.targetType && values.targetId
      ? targetLabel(t, { targetType: values.targetType, targetId: Number(values.targetId) })
      : null;

  return (
    <AdminPage description={t("auditLog.description")} title={t("auditLog.title")}>
      {values.actorId && (
        <FilterBanner clear={t("auditLog.clearAdmin")} onClear={() => set({ actorId: "" })}>
          {actor
            ? t("auditLog.byAdmin", { name: `${actor.firstName} ${actor.lastName}` })
            : t("auditLog.byAdminId", { id: values.actorId })}
        </FilterBanner>
      )}
      {target && (
        <FilterBanner clear={t("auditLog.clearTarget")} onClear={() => set({ targetType: "", targetId: "" })}>
          {t("auditLog.aboutFilter", { target })}
        </FilterBanner>
      )}
      <div className="flex flex-wrap items-end gap-12">
        <SelectField
          fieldClassName="w-full sm:w-auto"
          label={t("auditLog.action")}
          onChange={(event) => set({ action: event.target.value })}
          value={values.action}
        >
          <option value="">{t("auditLog.allActions")}</option>
          {(log.data?.actions ?? (values.action ? [values.action] : [])).map((action) => (
            <option key={action} value={action}>
              {actionLabel(t, action)}
            </option>
          ))}
        </SelectField>
        {!values.targetId && (
          <SelectField
            fieldClassName="w-full sm:w-auto"
            label={t("auditLog.targetType")}
            onChange={(event) => set({ targetType: event.target.value })}
            value={values.targetType}
          >
            <option value="">{t("auditLog.allTargets")}</option>
            {knownTargets.map((type) => (
              <option key={type} value={type}>
                {t(`auditLog.targetTypes.${type}`)}
              </option>
            ))}
          </SelectField>
        )}
      </div>
      {content()}
      <p className="flex items-start gap-8 rounded-md bg-info-soft p-12 type-body-s text-info">
        <Icon className="mt-2 shrink-0" name="info" size={16} />
        {t("auditLog.note")}
      </p>
    </AdminPage>
  );
}
