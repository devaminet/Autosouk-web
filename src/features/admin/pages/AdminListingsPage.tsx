import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Alert } from "../../../components/Alert";
import { Badge } from "../../../components/Badge";
import type { BadgeTone } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { Pagination } from "../../../components/Pagination";
import { formatDate, formatNumber } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import { adminUserPath, listingPath } from "../../../lib/paths";
import { AdminPage } from "../components/AdminPage";
import { AdminTable } from "../components/AdminTable";
import type { Column } from "../components/AdminTable";
import { FilterTabs } from "../components/FilterTabs";
import { ListSearch } from "../components/ListSearch";
import { ReasonDialog } from "../components/ReasonDialog";
import { useAdminListings, useAdminOverview, useApproveListing, useDeleteListing, useRejectListing } from "../hooks";
import { useListParams } from "../listParams";
import { listingStatuses } from "../listingsApi";
import type { AdminListing } from "../listingsApi";

const filterKeys = ["search", "status", "sellerId"] as const;

const listingTones: Record<(typeof listingStatuses)[number], BadgeTone> = {
  draft: "neutral",
  pending: "warning",
  approved: "success",
  withdrawn: "neutral",
  rejected: "danger",
  sold: "info",
};

// A translated list, such as a dialog's consequences.
const lines = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

// Every listing in every status, with filters kept in the link.
export function AdminListingsPage() {
  const { t } = useTranslation(["admin", "enums"]);
  const { page, values, set, hrefFor } = useListParams(filterKeys);
  const listings = useAdminListings({ page, ...values });
  const overview = useAdminOverview();
  const remove = useDeleteListing();
  const approve = useApproveListing();
  const reject = useRejectListing();
  const [deleting, setDeleting] = useState<AdminListing | null>(null);
  const [rejecting, setRejecting] = useState<AdminListing | null>(null);
  // What the last action did, or why an approval failed.
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const locale = getLocale();
  const counts = overview.data?.listings.byStatus;

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

  const carLine = (listing: AdminListing) => {
    if (!listing.car) {
      return t("listings.noCar");
    }
    const { make, model, year, city } = listing.car;
    return [[make, model, year].filter(Boolean).join(" "), city && t(`enums:city.${city}`, { defaultValue: city })]
      .filter(Boolean)
      .join(" · ");
  };

  const columns: Column<AdminListing>[] = [
    {
      header: t("listings.listing"),
      cell: (listing) => (
        <span className="flex flex-col gap-2">
          <span className="type-label-m text-ink" dir="auto">
            {listing.title}
          </span>
          <span className="type-body-xs text-muted">
            <bdi dir="ltr">#{listing.id}</bdi> · <bdi dir="auto">{carLine(listing)}</bdi>
          </span>
        </span>
      ),
    },
    {
      header: t("listings.status"),
      cell: (listing) =>
        listing.status && (
          <span className="flex flex-col gap-4">
            <Badge tone={listingTones[listing.status]}>{t(`enums:listing_status.${listing.status}`)}</Badge>
            {listing.status === "rejected" && listing.rejectionReason && (
              <span className="max-w-filters type-body-xs text-muted" dir="auto">
                {listing.rejectionReason}
              </span>
            )}
          </span>
        ),
    },
    {
      header: t("listings.seller"),
      cell: ({ seller }) =>
        seller && (
          <span className="flex flex-col gap-4">
            <Link
              className="rounded-xs text-ink-2 underline hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
              dir="auto"
              to={adminUserPath(seller.id)}
            >
              {seller.firstName} {seller.lastName}
            </Link>
            {seller.suspendedAt && <Badge tone="danger">{t("listings.sellerSuspended")}</Badge>}
          </span>
        ),
    },
    {
      header: t("listings.price"),
      cell: ({ car }) =>
        car?.price != null ? (
          <bdi className="type-label-m whitespace-nowrap text-ink" dir="ltr">
            {t("listings.mad", { price: formatNumber(car.price) })}
          </bdi>
        ) : (
          "—"
        ),
    },
    { header: t("listings.created"), cell: (listing) => formatDate(listing.createdAt, locale) },
    {
      header: t("listings.actions"),
      align: "end",
      cell: (listing) => (
        <span className="flex flex-wrap justify-end gap-4">
          {listing.status === "pending" && (
            <>
              <Button
                aria-label={t("listings.approveNamed", { title: listing.title })}
                isPending={approve.isPending && approve.variables === listing.id}
                onClick={() => {
                  setNotice(null);
                  approve.mutate(listing.id, {
                    onSuccess: () => setNotice({ tone: "success", text: t("listings.approved", { title: listing.title }) }),
                    onError: (error) =>
                      setNotice({
                        tone: "danger",
                        text: t("listings.approveFailed", { title: listing.title, message: error.message }),
                      }),
                  });
                }}
                size="s"
                variant="primary"
              >
                <Icon name="check" size={16} />
                {t("listings.approve")}
              </Button>
              <Button
                aria-label={t("listings.rejectNamed", { title: listing.title })}
                onClick={() => {
                  setNotice(null);
                  setRejecting(listing);
                }}
                size="s"
              >
                {t("listings.reject")}
              </Button>
            </>
          )}
          <ButtonLink aria-label={t("listings.openNamed", { title: listing.title })} size="s" to={listingPath(listing.id)}>
            {t("listings.open")}
          </ButtonLink>
          <Button
            aria-label={t("listings.deleteNamed", { title: listing.title })}
            onClick={() => {
              setNotice(null);
              setDeleting(listing);
            }}
            size="s"
            variant="ghost"
          >
            <Icon name="trash" size={16} />
          </Button>
        </span>
      ),
    },
  ];

  const content = () => {
    if (listings.isError) {
      return (
        <div className="flex flex-col items-start gap-12" role="alert">
          <Alert tone="danger">{listings.error.message}</Alert>
          <Button onClick={() => void listings.refetch()}>{t("retry")}</Button>
        </div>
      );
    }
    if (listings.isPending) {
      return <output className="type-body-m text-muted">{t("loading")}</output>;
    }
    const { meta } = listings.data;
    const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
    return (
      <>
        <AdminTable
          caption={t("listings.caption")}
          columns={columns}
          empty={t("listings.empty")}
          rowKey={(listing) => listing.id}
          rows={listings.data.listings}
        />
        <div className="flex flex-wrap items-center justify-between gap-12">
          <p className="type-body-s text-muted">
            <bdi dir="ltr">
              {t("listings.range", {
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

  const seller = listings.data?.listings.find((listing) => listing.seller)?.seller;
  const total = counts ? Object.values(counts).reduce((sum, count) => sum + count, 0) : undefined;

  return (
    <AdminPage description={t("listings.description")} title={t("listings.title")}>
      <output className="empty:hidden">{notice && <Alert tone={notice.tone}>{notice.text}</Alert>}</output>
      <ListSearch
        label={t("listings.search")}
        onSearch={(search) => set({ search })}
        placeholder={t("listings.searchPlaceholder")}
        value={values.search}
      />
      {values.sellerId && (
        <p className="flex flex-wrap items-center gap-12 type-label-m text-ink">
          {seller
            ? t("listings.sellerFilter", { name: `${seller.firstName} ${seller.lastName}` })
            : t("listings.sellerFilterId", { id: values.sellerId })}
          <Button onClick={() => set({ sellerId: "" })} size="s" variant="ghost">
            <Icon name="x" size={14} />
            {t("listings.clearSeller")}
          </Button>
        </p>
      )}
      <FilterTabs
        current={values.status}
        hrefFor={(status) => withValue("status", status)}
        items={[
          { value: "", label: t("listings.all"), count: total },
          ...listingStatuses.map((status) => ({
            value: status,
            label: t(`enums:listing_status.${status}`),
            count: counts?.[status],
          })),
        ]}
        label={t("listings.statusLabel")}
      />
      {content()}
      <p className="flex items-start gap-8 rounded-md bg-info-soft p-12 type-body-s text-info">
        <Icon className="mt-2 shrink-0" name="info" size={16} />
        {t("listings.hiddenNote")}
      </p>
      <ReasonDialog
        confirmIcon="trash"
        confirmLabel={t("listings.deleteDialog.confirm")}
        consequences={lines(t("listings.deleteDialog.consequences", { returnObjects: true }))}
        description={t("listings.deleteDialog.description")}
        error={remove.error?.message ?? null}
        helper={t("listings.deleteDialog.helper")}
        isPending={remove.isPending}
        label={t("listings.deleteDialog.label")}
        onClose={() => {
          setDeleting(null);
          remove.reset();
        }}
        onConfirm={(reason) => {
          if (!deleting) {
            return;
          }
          const title = deleting.title;
          remove.mutate(
            { listingId: deleting.id, reason },
            {
              onSuccess: () => {
                setDeleting(null);
                setNotice({ tone: "success", text: t("listings.deleted", { title }) });
              },
            },
          );
        }}
        open={deleting !== null}
        title={t("listings.deleteDialog.title", { title: deleting?.title ?? "" })}
      />
      <ReasonDialog
        confirmIcon="x"
        confirmLabel={t("listings.rejectDialog.confirm")}
        consequences={lines(t("listings.rejectDialog.consequences", { returnObjects: true }))}
        description={t("listings.rejectDialog.description")}
        error={reject.error?.message ?? null}
        helper={t("listings.rejectDialog.helper")}
        isPending={reject.isPending}
        label={t("listings.rejectDialog.label")}
        onClose={() => {
          setRejecting(null);
          reject.reset();
        }}
        onConfirm={(reason) => {
          if (!rejecting) {
            return;
          }
          const title = rejecting.title;
          reject.mutate(
            { listingId: rejecting.id, reason },
            {
              onSuccess: () => {
                setRejecting(null);
                setNotice({ tone: "success", text: t("listings.rejected", { title }) });
              },
            },
          );
        }}
        open={rejecting !== null}
        title={t("listings.rejectDialog.title", { title: rejecting?.title ?? "" })}
      />
    </AdminPage>
  );
}
