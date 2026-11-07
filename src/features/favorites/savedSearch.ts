import { savedSorts } from "./api";
import type { SavedSort } from "./api";

// The saved cars page's filter, kept in the address so it survives a reload.
export type SavedSearch = {
  // Only inspected cars, or only the others.
  inspected?: boolean;
  sort: SavedSort;
  page: number;
};

export const savedPageSize = 12;

const isSort = (value: string | null): value is SavedSort => savedSorts.some((sort) => sort === value);

export const readSavedSearch = (params: URLSearchParams): SavedSearch => {
  const inspected = params.get("inspected");
  const sort = params.get("sort");
  const page = Number(params.get("page"));
  return {
    inspected: inspected === "true" ? true : inspected === "false" ? false : undefined,
    sort: isSort(sort) ? sort : "recent",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
};

// Leaves out the defaults, so a plain visit keeps a plain address.
export const writeSavedSearch = ({ inspected, sort, page }: SavedSearch): URLSearchParams => {
  const params = new URLSearchParams();
  if (inspected !== undefined) {
    params.set("inspected", String(inspected));
  }
  if (sort !== "recent") {
    params.set("sort", sort);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  return params;
};
