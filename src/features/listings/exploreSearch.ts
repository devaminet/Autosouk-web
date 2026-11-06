import { listingSorts } from "./api";
import type { ListingSort, PublicListingsFilter } from "./api";

// The explore page's search, kept in the address so it can be shared.
export type ExploreSearch = {
  makeId?: number;
  modelId?: number;
  cityId?: number;
  maxPrice?: number;
  sort: ListingSort;
  page: number;
};

export const explorePageSize = 8;

// The quick filter in the design's chip row.
export const budgetPrice = 150_000;

const positive = (value: string | null): number | undefined => {
  if (value === null || !/^\d+$/u.test(value)) {
    return undefined;
  }
  const number = Number(value);
  return number > 0 ? number : undefined;
};

const isSort = (value: string | null): value is ListingSort =>
  listingSorts.some((sort) => sort === value);

export const readExploreSearch = (params: URLSearchParams): ExploreSearch => {
  const makeId = positive(params.get("makeId"));
  const sort = params.get("sort");
  return {
    makeId,
    // A model belongs to a make, so it means nothing alone.
    modelId: makeId === undefined ? undefined : positive(params.get("modelId")),
    cityId: positive(params.get("cityId")),
    maxPrice: positive(params.get("maxPrice")),
    sort: isSort(sort) ? sort : "newest",
    page: positive(params.get("page")) ?? 1,
  };
};

// Leaves out the defaults, so a plain visit keeps a plain address.
export const writeExploreSearch = (search: ExploreSearch): URLSearchParams => {
  const params = new URLSearchParams();
  const values: [string, number | string | undefined][] = [
    ["makeId", search.makeId],
    ["modelId", search.modelId],
    ["cityId", search.cityId],
    ["maxPrice", search.maxPrice],
    ["sort", search.sort === "newest" ? undefined : search.sort],
    ["page", search.page === 1 ? undefined : search.page],
  ];
  for (const [name, value] of values) {
    if (value !== undefined) {
      params.set(name, String(value));
    }
  }
  return params;
};

export const hasFilters = ({ makeId, cityId, maxPrice }: ExploreSearch): boolean =>
  makeId !== undefined || cityId !== undefined || maxPrice !== undefined;

export const toListingsFilter = (search: ExploreSearch): PublicListingsFilter => ({
  ...search,
  limit: explorePageSize,
});
