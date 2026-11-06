import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { PageTitle } from "../../../components/PageTitle";
import { formatNumber } from "../../../lib/format";
import { paths } from "../../../lib/paths";
import { ActiveFilters } from "../components/search/ActiveFilters";
import type { ActiveFilter } from "../components/search/ActiveFilters";
import { FiltersSheet } from "../components/search/FiltersSheet";
import { ListingResults } from "../components/search/ListingResults";
import { SearchFilters } from "../components/search/SearchFilters";
import { SortSelect } from "../components/search/SortSelect";
import { useEquipment, useLookups, useMakes, useModels, usePublicListings } from "../hooks";
import {
  clearedSearch,
  hasFilters,
  readListingSearch,
  searchPageSize,
  toListingsFilter,
  writeListingSearch,
} from "../listingSearch";
import type { ListingSearch } from "../listingSearch";

const price = (value: number) => <bdi dir="ltr">{formatNumber(value)}</bdi>;

// Approved listings with every filter the API supports.
export function SearchPage() {
  const { t } = useTranslation(["listings", "enums"]);
  const [params, setParams] = useSearchParams();
  const search = readListingSearch(params);
  const results = usePublicListings(toListingsFilter(search, searchPageSize));
  const makes = useMakes();
  const models = useModels(search.makeId ?? null);
  const lookups = useLookups();
  const equipment = useEquipment();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const categories = equipment.data ?? [];

  const update = (next: ListingSearch) => setParams(writeListingSearch(next), { preventScrollReset: true });
  // A new search starts again from its first page.
  const change = (changes: Partial<ListingSearch>) => update({ ...search, ...changes, page: 1 });
  const clear = () => update(clearedSearch(search));

  const make = makes.data?.find(({ id }) => id === search.makeId)?.name;
  const model = models.data?.find(({ id }) => id === search.modelId)?.name;
  const cityItem = lookups.data?.cities.find(({ id }) => id === search.cityId);
  const city = cityItem && t(`enums:city.${cityItem.slug}`, { defaultValue: cityItem.name });
  const car = [make, model].filter(Boolean).join(" ");
  const title = car
    ? city
      ? t("search.title.carInCity", { car, city })
      : car
    : city
      ? t("search.title.inCity", { city })
      : t("search.title.all");

  const { minPrice, maxPrice } = search;
  const mad = t("units.mad");
  const priceFilter = (): ActiveFilter | null => {
    const onRemove = () => change({ minPrice: undefined, maxPrice: undefined });
    if (minPrice !== undefined && maxPrice !== undefined) {
      return {
        id: "price",
        label: (
          <>
            {price(minPrice)} – {price(maxPrice)} {mad}
          </>
        ),
        name: `${formatNumber(minPrice)} – ${formatNumber(maxPrice)} ${mad}`,
        onRemove,
      };
    }
    if (minPrice !== undefined) {
      return {
        id: "price",
        label: (
          <>
            {t("search.active.from")} {price(minPrice)} {mad}
          </>
        ),
        name: `${t("search.active.from")} ${formatNumber(minPrice)} ${mad}`,
        onRemove,
      };
    }
    if (maxPrice !== undefined) {
      return {
        id: "price",
        label: (
          <>
            {t("search.active.upTo")} {price(maxPrice)} {mad}
          </>
        ),
        name: `${t("search.active.upTo")} ${formatNumber(maxPrice)} ${mad}`,
        onRemove,
      };
    }
    return null;
  };

  const items = categories.flatMap((category) => category.equipment);
  const active: ActiveFilter[] = [
    make ? { id: "make", label: make, name: make, onRemove: () => change({ makeId: undefined, modelId: undefined }) } : null,
    model ? { id: "model", label: model, name: model, onRemove: () => change({ modelId: undefined }) } : null,
    city ? { id: "city", label: city, name: city, onRemove: () => change({ cityId: undefined }) } : null,
    priceFilter(),
    ...items
      .filter(({ id }) => search.equipmentIds.includes(id))
      .map((item) => {
        const name = t(`enums:equipment.${item.slug}`, { defaultValue: item.name });
        return {
          id: `equipment-${item.id}`,
          label: name,
          name,
          onRemove: () => change({ equipmentIds: search.equipmentIds.filter((id) => id !== item.id) }),
        };
      }),
  ].filter((filter) => filter !== null);

  const filterProps = {
    categories,
    search,
    onApply: (filters: Partial<ListingSearch>) => {
      setFiltersOpen(false);
      change(filters);
    },
  };

  return (
    <div className="flex flex-col gap-24 px-20 py-24 md:px-48 md:py-40 lg:px-80">
      <PageTitle>{title}</PageTitle>
      <nav aria-label={t("search.breadcrumb")}>
        <ol className="flex items-center gap-8 type-label-s">
          <li>
            <Link
              className="rounded-xs text-muted hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              to={paths.home}
            >
              {t("search.explore")}
            </Link>
          </li>
          <li aria-hidden="true" className="text-muted">
            <Icon name="chevron-right" size={12} />
          </li>
          <li aria-current="page" className="min-w-0 truncate text-ink" dir="auto">
            {title}
          </li>
        </ol>
      </nav>
      <header className="flex flex-wrap items-end justify-between gap-16">
        <div className="flex min-w-0 flex-col gap-4">
          <h1 className="type-h1 text-ink md:type-display-m" dir="auto">
            {title}
          </h1>
          {results.data && (
            <p aria-live="polite" className="type-body-m text-muted">
              {t("explore.results.count", {
                count: results.data.meta.total,
                formatted: formatNumber(results.data.meta.total),
              })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-8">
          <Button className="lg:hidden" onClick={() => setFiltersOpen(true)} size="s">
            <Icon name="sliders" size={16} />
            {t("search.filters.title")}
            {active.length > 0 && (
              <span className="rounded-full bg-brand px-8 type-label-s text-on-brand">
                <bdi dir="ltr">{active.length}</bdi>
                <span className="sr-only">{t("search.filters.activeCount", { count: active.length })}</span>
              </span>
            )}
          </Button>
          <SortSelect onChange={(sort) => change({ sort })} showLabel value={search.sort} />
        </div>
      </header>
      <div className="flex flex-col gap-24 lg:flex-row lg:items-start lg:gap-32">
        <aside className="hidden w-filters shrink-0 rounded-2xl border border-line bg-surface p-24 lg:block">
          <SearchFilters key={params.toString()} {...filterProps} />
        </aside>
        <section aria-label={t("search.resultsLabel")} className="flex min-w-0 flex-1 flex-col gap-24">
          {active.length > 0 && <ActiveFilters filters={active} onClearAll={clear} />}
          <ListingResults
            error={results.error}
            filtered={hasFilters(search)}
            gridClassName="sm:grid-cols-2 xl:grid-cols-3 xl:gap-24"
            hrefFor={(page) => `?${writeListingSearch({ ...search, page })}`}
            onClear={clear}
            onRetry={() => void results.refetch()}
            results={results.data}
            showRange
          />
        </section>
      </div>
      <FiltersSheet {...filterProps} onClose={() => setFiltersOpen(false)} open={filtersOpen} />
    </div>
  );
}
