import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { chip, chipActive, chipIdle } from "../../../components/chipStyles";
import { Icon } from "../../../components/Icon";
import { PageTitle } from "../../../components/PageTitle";
import { Pagination } from "../../../components/Pagination";
import { formatNumber } from "../../../lib/format";
import { paths } from "../../../lib/paths";
import { PublicListingCard } from "../../listings/components/explore/PublicListingCard";
import { savedSorts } from "../api";
import type { SavedListing } from "../api";
import { useSavedListings, useToggleFavorite } from "../hooks";
import { readSavedSearch, savedPageSize, writeSavedSearch } from "../savedSearch";
import type { SavedSearch } from "../savedSearch";

const sortLabels = {
  recent: "saved.sort.recent",
  price_asc: "saved.sort.priceAsc",
  price_desc: "saved.sort.priceDesc",
} as const;

// The search page with the same make and model.
const similarHref = (listing: SavedListing) => {
  const params = new URLSearchParams();
  if (listing.car) {
    params.set("makeId", String(listing.car.makeId));
    params.set("modelId", String(listing.car.modelId));
  }
  return { pathname: paths.search, search: params.toString() };
};

// The listings the buyer keeps, with a filter on inspection and a sort.
export function SavedPage() {
  const { t } = useTranslation("listings");
  const [params, setParams] = useSearchParams();
  const search = readSavedSearch(params);
  const saved = useSavedListings({ ...search, limit: savedPageSize });
  const toggle = useToggleFavorite();

  const update = (changes: Partial<SavedSearch>) =>
    setParams(writeSavedSearch({ ...search, ...changes, page: 1 }), { preventScrollReset: true });

  const counts = saved.data?.counts;
  const filters: { inspected: boolean | undefined; label: string; count?: number }[] = [
    { inspected: undefined, label: t("saved.filters.all"), count: counts?.all },
    { inspected: true, label: t("saved.filters.inspected"), count: counts?.inspected },
    {
      inspected: false,
      label: t("saved.filters.notInspected"),
      count: counts ? counts.all - counts.inspected : undefined,
    },
  ];

  const body = () => {
    if (saved.error) {
      return (
        <div className="flex flex-col items-start gap-16" role="alert">
          <Alert tone="danger">{saved.error.message}</Alert>
          <Button onClick={() => void saved.refetch()}>{t("explore.results.retry")}</Button>
        </div>
      );
    }
    if (!saved.data) {
      return <output className="block type-body-m text-muted">{t("common:loading")}</output>;
    }
    if (saved.data.counts.all === 0) {
      return (
        <div className="flex flex-col items-center gap-16 px-24 py-48 text-center">
          <span className="flex size-96 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Icon name="heart" size={48} />
          </span>
          <h2 className="type-h3 text-ink">{t("saved.empty.title")}</h2>
          <p className="max-w-auth type-body-m text-muted">{t("saved.empty.description")}</p>
          <ButtonLink size="l" to={paths.home} variant="dark">
            <Icon name="search" size={18} />
            {t("saved.empty.explore")}
          </ButtonLink>
        </div>
      );
    }
    const { listings, meta } = saved.data;
    if (listings.length === 0) {
      return (
        <div className="flex flex-col items-center gap-16 rounded-2xl border border-dashed border-line-strong px-24 py-48 text-center">
          <p className="type-h5 text-ink">{t("saved.noMatch")}</p>
          <Button onClick={() => update({ inspected: undefined })}>{t("saved.showAll")}</Button>
        </div>
      );
    }
    return (
      <>
        <ul className="grid gap-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-24">
          {listings.map((listing) => (
            <PublicListingCard
              key={listing.id}
              listing={listing}
              unavailable={
                listing.status === "approved"
                  ? undefined
                  : t(listing.status === "sold" ? "saved.status.sold" : "saved.status.unavailable")
              }
            >
              {listing.status !== "approved" && (
                <div className="flex flex-wrap items-center gap-8">
                  <Button
                    aria-label={t("saved.removeLabel", { title: listing.title })}
                    onClick={() => toggle.mutate({ listingId: listing.id, favorite: false })}
                    size="s"
                  >
                    <Icon name="trash" size={16} />
                    {t("saved.remove")}
                  </Button>
                  {listing.car && (
                    <Link
                      aria-label={t("saved.findSimilarLabel", { title: listing.title })}
                      className="flex min-h-control-s items-center gap-4 rounded-full px-12 type-label-m text-ink hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      to={similarHref(listing)}
                    >
                      <Icon name="search" size={16} />
                      {t("saved.findSimilar")}
                    </Link>
                  )}
                </div>
              )}
            </PublicListingCard>
          ))}
        </ul>
        {meta.page >= meta.totalPages ? (
          <p className="text-center type-body-s text-muted">{t("saved.end")}</p>
        ) : null}
        <Pagination
          hrefFor={(page) => `?${writeSavedSearch({ ...search, page })}`}
          page={meta.page}
          totalPages={meta.totalPages}
        />
      </>
    );
  };

  return (
    <div className="flex flex-col gap-24 px-20 py-24 md:px-48 md:py-40 lg:px-80">
      <PageTitle>{t("saved.title")}</PageTitle>
      <header className="flex flex-wrap items-end justify-between gap-16">
        <div className="flex min-w-0 flex-col gap-4">
          <p className="type-overline text-brand">{t("saved.overline")}</p>
          <h1 className="type-h1 text-ink md:type-display-m">{t("saved.title")}</h1>
          {counts && counts.all > 0 && (
            <p aria-live="polite" className="type-body-m text-muted">
              {[
                t("saved.count", { count: counts.all, formatted: formatNumber(counts.all) }),
                t("saved.inspectedCount", { count: counts.inspected, formatted: formatNumber(counts.inspected) }),
                t("saved.hint"),
              ].join(" · ")}
            </p>
          )}
        </div>
        {counts && counts.all > 0 && (
          <div className="flex flex-wrap items-center gap-8">
            <ul aria-label={t("saved.filters.label")} className="flex flex-wrap gap-8">
              {filters.map(({ inspected, label, count }) => {
                const active = search.inspected === inspected;
                return (
                  <li key={String(inspected)}>
                    <button
                      aria-pressed={active}
                      className={`${chip} gap-8 ${active ? chipActive : chipIdle}`}
                      onClick={() => update({ inspected })}
                      type="button"
                    >
                      {inspected === true && <Icon name="shield" size={16} />}
                      {label}
                      {/* Keeps the label and the count apart in the button's name. */}{" "}
                      {count !== undefined && <bdi dir="ltr">{formatNumber(count)}</bdi>}
                    </button>
                  </li>
                );
              })}
            </ul>
            <label className={`${chip} ${chipIdle} gap-8`}>
              <Icon name="sliders" size={16} />
              <span className="sr-only">{t("explore.sort.label")}</span>
              <select
                className="cursor-pointer bg-transparent outline-none"
                onChange={(event) => {
                  const sort = savedSorts.find((item) => item === event.target.value);
                  if (sort) {
                    update({ sort });
                  }
                }}
                value={search.sort}
              >
                {savedSorts.map((sort) => (
                  <option key={sort} value={sort}>
                    {t(sortLabels[sort])}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </header>
      <section aria-label={t("saved.title")} className="flex flex-col gap-24">
        {body()}
      </section>
    </div>
  );
}
