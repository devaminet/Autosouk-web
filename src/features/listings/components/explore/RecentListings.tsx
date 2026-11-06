import { useTranslation } from "react-i18next";
import { Alert } from "../../../../components/Alert";
import { Button } from "../../../../components/Button";
import { Icon } from "../../../../components/Icon";
import { Pagination } from "../../../../components/Pagination";
import { formatNumber } from "../../../../lib/format";
import { listingSorts } from "../../api";
import type { ListingSort, PublicListings } from "../../api";
import { budgetPrice, hasFilters, writeExploreSearch } from "../../exploreSearch";
import type { ExploreSearch } from "../../exploreSearch";
import { PublicListingCard } from "./PublicListingCard";

type RecentListingsProps = {
  search: ExploreSearch;
  onSearch: (changes: Partial<ExploreSearch>) => void;
  onClear: () => void;
  results?: PublicListings;
  error: Error | null;
  onRetry: () => void;
  cityName?: string;
};

const chip =
  "flex min-h-control-s cursor-pointer items-center rounded-full px-16 type-label-m whitespace-nowrap ring-1 ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const chipIdle = "bg-surface text-ink ring-line hover:bg-surface-2";
const chipActive = "bg-ink text-surface ring-ink";

export function RecentListings({ search, onSearch, onClear, results, error, onRetry, cityName }: RecentListingsProps) {
  const { t } = useTranslation("listings");
  const filtered = hasFilters(search);
  const budget = search.maxPrice === budgetPrice;

  const content = () => {
    if (error) {
      return (
        <div className="flex flex-col items-start gap-16" role="alert">
          <Alert tone="danger">{error.message}</Alert>
          <Button onClick={onRetry}>{t("explore.results.retry")}</Button>
        </div>
      );
    }
    if (!results) {
      return <output className="block type-body-m text-muted">{t("common:loading")}</output>;
    }
    if (results.listings.length === 0) {
      return (
        <div className="flex flex-col items-center gap-16 rounded-2xl border border-dashed border-line-strong px-24 py-48 text-center">
          <Icon className="text-muted" name="car" size={32} />
          <p className="type-h5 text-ink">{t(filtered ? "explore.results.noMatch" : "explore.results.empty")}</p>
          {filtered && <Button onClick={onClear}>{t("explore.results.clear")}</Button>}
        </div>
      );
    }
    return (
      <>
        <ul className="grid gap-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-24">
          {results.listings.map((listing) => (
            <PublicListingCard key={listing.id} listing={listing} />
          ))}
        </ul>
        <Pagination
          hrefFor={(page) => `?${writeExploreSearch({ ...search, page })}`}
          page={results.meta.page}
          totalPages={results.meta.totalPages}
        />
      </>
    );
  };

  return (
    <section aria-labelledby="listings-title" className="flex scroll-mt-24 flex-col gap-24 px-20 md:px-48" id="listings">
      <div className="flex flex-wrap items-end justify-between gap-16">
        <div className="flex flex-col gap-4">
          <p className="type-overline text-brand">
            {cityName ? t("explore.results.inCity", { city: cityName }) : t("explore.results.overline")}
          </p>
          <h2 className="type-h2 text-ink md:type-h1" id="listings-title">
            {t(filtered ? "explore.results.matching" : "explore.results.title")}
          </h2>
          {results && (
            <p aria-live="polite" className="type-body-s text-muted">
              {t("explore.results.count", { count: results.meta.total, formatted: formatNumber(results.meta.total) })}
            </p>
          )}
        </div>
        <label className={`${chip} ${chipIdle} gap-8`}>
          <span className="sr-only">{t("explore.sort.label")}</span>
          <select
            className="cursor-pointer bg-transparent outline-none"
            onChange={(event) => {
              const sort = listingSorts.find((value) => value === event.target.value);
              if (sort) {
                onSearch({ sort });
              }
            }}
            value={search.sort}
          >
            {listingSorts.map((sort: ListingSort) => (
              <option key={sort} value={sort}>
                {t(`explore.sort.${sort}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ul aria-label={t("explore.chips.label")} className="-mx-20 flex gap-8 overflow-x-auto px-20 no-scrollbar md:mx-0 md:px-0">
        <li>
          <button aria-pressed={!filtered} className={`${chip} ${filtered ? chipIdle : chipActive}`} onClick={onClear} type="button">
            {t("explore.chips.all")}
          </button>
        </li>
        <li>
          <button
            aria-pressed={budget}
            className={`${chip} ${budget ? chipActive : chipIdle}`}
            onClick={() => onSearch({ maxPrice: budget ? undefined : budgetPrice })}
            type="button"
          >
            {t("explore.chips.under", { price: formatNumber(budgetPrice) })}
          </button>
        </li>
      </ul>
      {content()}
    </section>
  );
}
