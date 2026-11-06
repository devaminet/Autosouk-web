import { listingStatusSchema } from "./api";
import type { MyListingsFilter } from "./api";

// The listing open in the edit drawer, if any.
export const parseEditParam = (params: URLSearchParams): number | null => {
  const value = params.get("edit") ?? "";
  return /^\d+$/u.test(value) ? Number(value) : null;
};

const statusParamSchema = listingStatusSchema.nullable().catch(null);

// The filter lives in the URL. Anything invalid there falls back to the default.
export const parseMyListingsSearch = (params: URLSearchParams): MyListingsFilter => {
  const status = statusParamSchema.parse(params.get("status")) ?? undefined;
  const page = Number(params.get("page"));
  return { status, page: Number.isInteger(page) && page > 0 ? page : 1 };
};

export const myListingsSearch = ({
  status,
  page,
  edit,
}: MyListingsFilter & { edit?: number }): string => {
  const params = new URLSearchParams();
  if (status) {
    params.set("status", status);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  if (edit !== undefined) {
    params.set("edit", String(edit));
  }
  return params.size > 0 ? `?${params}` : "";
};
