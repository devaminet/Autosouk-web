import { listingStatusSchema } from "./api";
import type { MyListingsFilter } from "./api";

const statusParamSchema = listingStatusSchema.nullable().catch(null);

// The filter lives in the URL. Anything invalid there falls back to the default.
export const parseMyListingsSearch = (params: URLSearchParams): MyListingsFilter => {
  const status = statusParamSchema.parse(params.get("status")) ?? undefined;
  const page = Number(params.get("page"));
  return { status, page: Number.isInteger(page) && page > 0 ? page : 1 };
};

export const myListingsSearch = ({ status, page }: MyListingsFilter): string => {
  const params = new URLSearchParams();
  if (status) {
    params.set("status", status);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  return params.size > 0 ? `?${params}` : "";
};
