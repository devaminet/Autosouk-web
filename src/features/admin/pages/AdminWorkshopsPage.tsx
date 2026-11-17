import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Alert } from "../../../components/Alert";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { Pagination } from "../../../components/Pagination";
import { SelectField } from "../../../components/SelectField";
import { formatDate, formatNumber } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import { adminUserPath, adminVerificationPath, mechanicPath } from "../../../lib/paths";
import { useCityOptions } from "../../auth/hooks";
import { AdminPage } from "../components/AdminPage";
import { AdminTable } from "../components/AdminTable";
import type { Column } from "../components/AdminTable";
import { FilterTabs } from "../components/FilterTabs";
import { ListSearch } from "../components/ListSearch";
import { useAdminOverview, useAdminWorkshops } from "../hooks";
import { useListParams } from "../listParams";
import type { AdminWorkshop } from "../workshopsApi";

const filterKeys = ["search", "status", "cityId"] as const;

const linkClass =
  "rounded-xs text-ink-2 underline hover:text-ink focus-visible:outline-2 focus-visible:outline-brand";

// Every workshop, bookable or not, with filters kept in the link.
export function AdminWorkshopsPage() {
  const { t } = useTranslation(["admin", "enums"]);
  const { page, values, set, hrefFor } = useListParams(filterKeys);
  const workshops = useAdminWorkshops({ page, ...values });
  const overview = useAdminOverview();
  const cities = useCityOptions();
  const locale = getLocale();
  const totals = overview.data;

  const statusHref = (status: string) => {
    const params = new URLSearchParams(hrefFor(1).slice(1));
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    const query = params.toString();
    return query ? `?${query}` : "?";
  };

  const columns: Column<AdminWorkshop>[] = [
    {
      header: t("workshops.workshop"),
      cell: (workshop) => (
        <span className="flex flex-col gap-2">
          <span className="type-label-m text-ink" dir="auto">
            {workshop.name}
          </span>
          <span className="type-body-xs text-muted">
            <bdi dir="ltr">#{workshop.id}</bdi> ·{" "}
            <bdi dir="auto">{t(`enums:city.${workshop.city}`, { defaultValue: workshop.city })}</bdi>
          </span>
        </span>
      ),
    },
    {
      header: t("workshops.owner"),
      cell: ({ user }) => (
        <span className="flex flex-col gap-4">
          <Link className={linkClass} dir="auto" to={adminUserPath(user.id)}>
            {user.firstName} {user.lastName}
          </Link>
          {user.suspendedAt && <Badge tone="danger">{t("workshops.ownerSuspended")}</Badge>}
        </span>
      ),
    },
    {
      header: t("workshops.status"),
      cell: (workshop) => (
        <span className="flex flex-col items-start gap-4">
          {workshop.bookable ? (
            <Badge tone="success">{t("workshops.bookable")}</Badge>
          ) : (
            <Badge tone="neutral">{t("workshops.notBookable")}</Badge>
          )}
          {workshop.awaitingReview && <Badge tone="warning">{t("workshops.awaitingReview")}</Badge>}
          {!workshop.isActive && <Badge tone="neutral">{t("workshops.paused")}</Badge>}
        </span>
      ),
    },
    {
      header: t("workshops.rating"),
      cell: (workshop) =>
        workshop.averageRating === null ? (
          <span className="type-body-s text-muted">{t("workshops.noReviews")}</span>
        ) : (
          <span className="flex flex-col gap-2">
            <span className="flex items-center gap-4 type-label-m text-ink">
              <Icon className="text-saffron" name="star" size={14} />
              <bdi dir="ltr">{formatNumber(workshop.averageRating)}</bdi>
            </span>
            <span className="type-body-xs text-muted">
              {t("workshops.reviews", { count: workshop.reviewsCount })}
            </span>
          </span>
        ),
    },
    {
      header: t("workshops.inspections"),
      cell: (workshop) => <bdi dir="ltr">{formatNumber(workshop.completedInspections)}</bdi>,
    },
    {
      header: t("workshops.price"),
      cell: ({ inspectionPrice }) =>
        inspectionPrice === null ? (
          "—"
        ) : (
          <bdi className="type-label-m whitespace-nowrap text-ink" dir="ltr">
            {t("workshops.mad", { price: formatNumber(inspectionPrice) })}
          </bdi>
        ),
    },
    { header: t("workshops.created"), cell: (workshop) => formatDate(workshop.createdAt, locale) },
    {
      header: t("workshops.actions"),
      align: "end",
      cell: (workshop) => (
        <span className="flex justify-end gap-4">
          {workshop.awaitingReview && (
            <ButtonLink
              aria-label={t("workshops.reviewNamed", { name: workshop.name })}
              size="s"
              to={adminVerificationPath(workshop.user.id)}
              variant="primary"
            >
              {t("workshops.review")}
            </ButtonLink>
          )}
          {workshop.bookable && (
            <ButtonLink
              aria-label={t("workshops.openNamed", { name: workshop.name })}
              size="s"
              to={mechanicPath(workshop.id)}
            >
              {t("workshops.open")}
            </ButtonLink>
          )}
        </span>
      ),
    },
  ];

  const content = () => {
    if (workshops.isError) {
      return (
        <div className="flex flex-col items-start gap-12" role="alert">
          <Alert tone="danger">{workshops.error.message}</Alert>
          <Button onClick={() => void workshops.refetch()}>{t("retry")}</Button>
        </div>
      );
    }
    if (workshops.isPending) {
      return <output className="type-body-m text-muted">{t("loading")}</output>;
    }
    const { meta } = workshops.data;
    const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
    return (
      <>
        <AdminTable
          caption={t("workshops.caption")}
          columns={columns}
          empty={t("workshops.empty")}
          rowKey={(workshop) => workshop.id}
          rows={workshops.data.mechanics}
        />
        <div className="flex flex-wrap items-center justify-between gap-12">
          <p className="type-body-s text-muted">
            <bdi dir="ltr">
              {t("workshops.range", {
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

  return (
    <AdminPage description={t("workshops.description")} title={t("workshops.title")}>
      <div className="flex flex-wrap items-end gap-12">
        <ListSearch
          label={t("workshops.search")}
          onSearch={(search) => set({ search })}
          placeholder={t("workshops.searchPlaceholder")}
          value={values.search}
        />
        <SelectField
          disabled={cities.isPending}
          fieldClassName="w-full sm:w-auto"
          label={t("workshops.city")}
          onChange={(event) => set({ cityId: event.target.value })}
          value={values.cityId}
        >
          <option value="">{t("workshops.allCities")}</option>
          {cities.options.map((city) => (
            <option key={city.id} value={String(city.id)}>
              {city.label}
            </option>
          ))}
        </SelectField>
      </div>
      <FilterTabs
        current={values.status}
        hrefFor={statusHref}
        items={[
          { value: "", label: t("workshops.all"), count: totals?.mechanics.total },
          { value: "bookable", label: t("workshops.bookable"), count: totals?.mechanics.bookable },
          {
            value: "not_bookable",
            label: t("workshops.notBookable"),
            count: totals ? totals.mechanics.total - totals.mechanics.bookable : undefined,
          },
          {
            value: "awaiting_review",
            label: t("workshops.awaitingReview"),
            count: totals?.queues.mechanicDocuments,
          },
        ]}
        label={t("workshops.statusLabel")}
      />
      {content()}
      <p className="flex items-start gap-8 rounded-md bg-info-soft p-12 type-body-s text-info">
        <Icon className="mt-2 shrink-0" name="info" size={16} />
        {t("workshops.bookableNote")}
      </p>
    </AdminPage>
  );
}
