import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Alert } from "../../../components/Alert";
import { Badge } from "../../../components/Badge";
import type { BadgeTone } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { Pagination } from "../../../components/Pagination";
import { formatDayTime, formatNumber } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import { adminUserPath, listingPath } from "../../../lib/paths";
import { inspectionStatuses } from "../../inspections/api";
import type { InspectionStatus } from "../../inspections/api";
import { AdminPage } from "../components/AdminPage";
import { AdminTable } from "../components/AdminTable";
import type { Column } from "../components/AdminTable";
import { FilterTabs } from "../components/FilterTabs";
import { useAdminInspections, useAdminOverview } from "../hooks";
import type { AdminInspection } from "../inspectionsApi";
import { useListParams } from "../listParams";

const filterKeys = ["status", "buyerId", "mechanicId"] as const;

const statusTones: Record<InspectionStatus, BadgeTone> = {
  pending: "warning",
  accepted: "info",
  rejected: "danger",
  in_progress: "brand",
  completed: "success",
  cancelled: "neutral",
};

const linkClass =
  "rounded-xs text-ink-2 underline hover:text-ink focus-visible:outline-2 focus-visible:outline-brand";

// One filter in effect, with a button that removes it.
function FilterBanner({ label, clear, onClear }: { label: string; clear: string; onClear: () => void }) {
  return (
    <p className="flex flex-wrap items-center gap-12 type-label-m text-ink">
      <span dir="auto">{label}</span>
      <Button onClick={onClear} size="s" variant="ghost">
        <Icon name="x" size={14} />
        {clear}
      </Button>
    </p>
  );
}

// Every inspection on the site, with filters kept in the link.
export function AdminInspectionsPage() {
  const { t } = useTranslation(["admin", "enums"]);
  const { page, values, set, hrefFor } = useListParams(filterKeys);
  const inspections = useAdminInspections({ page, ...values });
  const overview = useAdminOverview();
  const locale = getLocale();
  const counts = overview.data?.inspections.byStatus;
  const rows = inspections.data?.inspections ?? [];

  const withValue = (key: string, value: string) => {
    const params = new URLSearchParams(hrefFor(1).slice(1));
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const query = params.toString();
    return query ? `?${query}` : "?";
  };

  const carName = ({ car }: AdminInspection) =>
    [car.make, car.model, car.year].filter(Boolean).join(" ") || t("inspections.unknownCar");

  const columns: Column<AdminInspection>[] = [
    {
      header: t("inspections.inspection"),
      cell: (inspection) => (
        <span className="flex flex-col gap-2">
          <span className="type-label-m text-ink">
            <bdi dir="ltr">#{inspection.id}</bdi>
          </span>
          <span className="type-body-xs text-muted">
            {t("inspections.requested", { date: formatDayTime(inspection.requestedAt, locale) })}
          </span>
        </span>
      ),
    },
    {
      header: t("inspections.car"),
      cell: (inspection) => (
        <span className="flex flex-col items-start gap-4">
          {inspection.car.listingId !== null && !inspection.car.removed ? (
            <Link className={linkClass} dir="auto" to={listingPath(inspection.car.listingId)}>
              {carName(inspection)}
            </Link>
          ) : (
            <span className="type-body-s text-ink" dir="auto">
              {carName(inspection)}
            </span>
          )}
          {inspection.car.removed && <Badge tone="neutral">{t("inspections.carDeleted")}</Badge>}
        </span>
      ),
    },
    {
      header: t("inspections.buyer"),
      cell: ({ buyer }) => (
        <Link className={linkClass} dir="auto" to={adminUserPath(buyer.id)}>
          {buyer.firstName} {buyer.lastName}
        </Link>
      ),
    },
    {
      header: t("inspections.workshop"),
      cell: ({ mechanic }) => (
        <Link
          aria-label={t("inspections.ofWorkshopNamed", { name: mechanic.name })}
          className={linkClass}
          dir="auto"
          to={withValue("mechanicId", String(mechanic.id))}
        >
          {mechanic.name}
        </Link>
      ),
    },
    {
      header: t("inspections.status"),
      cell: (inspection) => (
        <Badge tone={statusTones[inspection.status]}>{t(`enums:inspection_status.${inspection.status}`)}</Badge>
      ),
    },
    {
      header: t("inspections.result"),
      cell: (inspection) =>
        inspection.verdict === null ? (
          "—"
        ) : (
          <span className="flex flex-col gap-2">
            <span className="type-label-m text-ink">{t(`enums:inspection_verdict.${inspection.verdict}`)}</span>
            {inspection.overallScore !== null && (
              <span className="type-body-xs text-muted">
                <bdi dir="ltr">{t("inspections.score", { score: formatNumber(inspection.overallScore) })}</bdi>
              </span>
            )}
          </span>
        ),
    },
    {
      header: t("inspections.report"),
      cell: (inspection) =>
        inspection.hasReport ? (
          <span className="flex items-center gap-4 type-body-s text-ink-2">
            <Icon className="text-success" name="file-check" size={16} />
            {t("inspections.reportSent")}
          </span>
        ) : (
          <span className="type-body-s text-muted">{t("inspections.noReport")}</span>
        ),
    },
    {
      header: t("inspections.price"),
      align: "end",
      cell: ({ priceAtRequest }) => (
        <bdi className="type-label-m whitespace-nowrap text-ink" dir="ltr">
          {t("inspections.mad", { price: formatNumber(priceAtRequest) })}
        </bdi>
      ),
    },
  ];

  const content = () => {
    if (inspections.isError) {
      return (
        <div className="flex flex-col items-start gap-12" role="alert">
          <Alert tone="danger">{inspections.error.message}</Alert>
          <Button onClick={() => void inspections.refetch()}>{t("retry")}</Button>
        </div>
      );
    }
    if (inspections.isPending) {
      return <output className="type-body-m text-muted">{t("loading")}</output>;
    }
    const { meta } = inspections.data;
    const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
    return (
      <>
        <AdminTable
          caption={t("inspections.caption")}
          columns={columns}
          empty={t("inspections.empty")}
          rowKey={(inspection) => inspection.id}
          rows={inspections.data.inspections}
        />
        <div className="flex flex-wrap items-center justify-between gap-12">
          <p className="type-body-s text-muted">
            <bdi dir="ltr">
              {t("inspections.range", {
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

  // The names come from the rows, which all share the filtered buyer or workshop.
  const buyer = rows[0]?.buyer;
  const workshop = rows[0]?.mechanic;
  const filtered = Boolean(values.buyerId || values.mechanicId);
  const total = counts ? Object.values(counts).reduce((sum, count) => sum + count, 0) : undefined;

  return (
    <AdminPage description={t("inspections.description")} title={t("inspections.title")}>
      {values.buyerId && (
        <FilterBanner
          clear={t("inspections.clearBuyer")}
          label={
            buyer
              ? t("inspections.buyerFilter", { name: `${buyer.firstName} ${buyer.lastName}` })
              : t("inspections.buyerFilterId", { id: values.buyerId })
          }
          onClear={() => set({ buyerId: "" })}
        />
      )}
      {values.mechanicId && (
        <FilterBanner
          clear={t("inspections.clearWorkshop")}
          label={
            workshop
              ? t("inspections.workshopFilter", { name: workshop.name })
              : t("inspections.workshopFilterId", { id: values.mechanicId })
          }
          onClear={() => set({ mechanicId: "" })}
        />
      )}
      <FilterTabs
        current={values.status}
        hrefFor={(status) => withValue("status", status)}
        items={[
          // Site-wide counts only make sense without a buyer or workshop filter.
          { value: "", label: t("inspections.all"), count: filtered ? undefined : total },
          ...inspectionStatuses.map((status) => ({
            value: status,
            label: t(`enums:inspection_status.${status}`),
            count: filtered ? undefined : counts?.[status],
          })),
        ]}
        label={t("inspections.statusLabel")}
      />
      {content()}
      <p className="flex items-start gap-8 rounded-md bg-info-soft p-12 type-body-s text-info">
        <Icon className="mt-2 shrink-0" name="info" size={16} />
        {t("inspections.deletedNote")}
      </p>
    </AdminPage>
  );
}
