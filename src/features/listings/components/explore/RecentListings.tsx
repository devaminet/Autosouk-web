import { useTranslation } from "react-i18next";
import { ButtonLink } from "../../../../components/ButtonLink";
import { Icon } from "../../../../components/Icon";
import { formatNumber } from "../../../../lib/format";
import { paths } from "../../../../lib/paths";
import type { PublicListings } from "../../api";
import { budgetPrice, hasFilters, writeListingSearch } from "../../listingSearch";
import type { ListingSearch } from "../../listingSearch";
import { chip, chipActive, chipIdle } from "../search/chipStyles";
import { ListingResults } from "../search/ListingResults";
import { SortSelect } from "../search/SortSelect";

type RecentListingsProps = {
  search: ListingSearch;
  onSearch: (changes: Partial<ListingSearch>) => void;
  onClear: () => void;
  results?: PublicListings;
  error: Error | null;
  onRetry: () => void;
  cityName?: string;
};

export function RecentListings({ search, onSearch, onClear, results, error, onRetry, cityName }: RecentListingsProps) {
  const { t } = useTranslation("listings");
  const filtered = hasFilters(search);
  const budget = search.maxPrice === budgetPrice;
  const searchQuery = writeListingSearch({ ...search, page: 1 }).toString();

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
        <div className="flex flex-wrap items-center gap-8">
          <SortSelect onChange={(sort) => onSearch({ sort })} value={search.sort} />
          <ButtonLink size="s" to={{ pathname: paths.search, search: searchQuery }}>
            {t("explore.results.viewAll")}
            <Icon name="arrow-right" size={16} />
          </ButtonLink>
        </div>
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
      <ListingResults
        error={error}
        filtered={filtered}
        gridClassName="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-24"
        hrefFor={(page) => `?${writeListingSearch({ ...search, page })}`}
        onClear={onClear}
        onRetry={onRetry}
        results={results}
      />
    </section>
  );
}
