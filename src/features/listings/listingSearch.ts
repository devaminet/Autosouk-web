import { listingSorts, transmissions } from "./api";
import type { ListingSort, PublicListingsFilter, Transmission } from "./api";

// A search of approved listings, kept in the address so it can be shared.
// The explore page and the search page read the same parameters.
export type ListingSearch = {
  makeId?: number;
  modelId?: number;
  cityId?: number;
  minPrice?: number;
  maxPrice?: number;
  // Cars must have every item.
  equipmentIds: number[];
  transmission?: Transmission;
  // Cars with any of these fuels.
  carburantIds: number[];
  sort: ListingSort;
  page: number;
};

export const explorePageSize = 8;
export const searchPageSize = 9;

// The quick filter in the explore page's chip row.
export const budgetPrice = 150_000;

const positive = (value: string | null | undefined): number | undefined => {
  if (value === null || value === undefined || !/^\d+$/u.test(value)) {
    return undefined;
  }
  const number = Number(value);
  return number > 0 ? number : undefined;
};

const isSort = (value: string | null): value is ListingSort =>
  listingSorts.some((sort) => sort === value);

const isTransmission = (value: string | null): value is Transmission =>
  transmissions.some((transmission) => transmission === value);

// Sorted and without repeats, so one choice has one address.
const idList = (value: string | null): number[] =>
  [
    ...new Set(
      (value ?? "")
        .split(",")
        .map((part) => positive(part.trim()))
        .filter((id) => id !== undefined),
    ),
  ].sort((a, b) => a - b);

export const readListingSearch = (params: URLSearchParams): ListingSearch => {
  const makeId = positive(params.get("makeId"));
  const sort = params.get("sort");
  const transmission = params.get("transmission");
  return {
    makeId,
    // A model belongs to a make, so it means nothing alone.
    modelId: makeId === undefined ? undefined : positive(params.get("modelId")),
    cityId: positive(params.get("cityId")),
    minPrice: positive(params.get("minPrice")),
    maxPrice: positive(params.get("maxPrice")),
    equipmentIds: idList(params.get("equipmentIds")),
    transmission: isTransmission(transmission) ? transmission : undefined,
    carburantIds: idList(params.get("carburantIds")),
    sort: isSort(sort) ? sort : "newest",
    page: positive(params.get("page")) ?? 1,
  };
};

// Leaves out the defaults, so a plain visit keeps a plain address.
export const writeListingSearch = (search: ListingSearch): URLSearchParams => {
  const params = new URLSearchParams();
  const list = (ids: number[]) => {
    const unique = [...new Set(ids)].sort((a, b) => a - b);
    return unique.length > 0 ? unique.join(",") : undefined;
  };
  const values: [string, number | string | undefined][] = [
    ["makeId", search.makeId],
    ["modelId", search.modelId],
    ["cityId", search.cityId],
    ["minPrice", search.minPrice],
    ["maxPrice", search.maxPrice],
    ["equipmentIds", list(search.equipmentIds)],
    ["transmission", search.transmission],
    ["carburantIds", list(search.carburantIds)],
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

// The same search without filters, keeping its sort.
export const clearedSearch = ({ sort }: ListingSearch): ListingSearch => ({
  equipmentIds: [],
  carburantIds: [],
  sort,
  page: 1,
});

export const hasFilters = (search: ListingSearch): boolean =>
  search.makeId !== undefined ||
  search.cityId !== undefined ||
  search.minPrice !== undefined ||
  search.maxPrice !== undefined ||
  search.equipmentIds.length > 0 ||
  search.transmission !== undefined ||
  search.carburantIds.length > 0;

export const toListingsFilter = (search: ListingSearch, limit: number): PublicListingsFilter => ({
  ...search,
  equipmentIds: search.equipmentIds.length > 0 ? search.equipmentIds : undefined,
  carburantIds: search.carburantIds.length > 0 ? search.carburantIds : undefined,
  limit,
});
