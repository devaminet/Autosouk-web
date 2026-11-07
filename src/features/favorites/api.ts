import { z } from "zod";
import { request } from "../../lib/api/client";
import { listingCardSchema, listingStatusSchema } from "../listings/api";

const favoriteIdsSchema = z.object({ listingIds: z.array(z.number()) });

// The ids of every listing the buyer keeps. They mark the hearts on cards.
export const getFavoriteIds = async (): Promise<number[]> =>
  (await request("/api/favorite_listings/ids", { schema: favoriteIdsSchema })).listingIds;

// Keeping a listing twice, or removing one that isn't kept, is not an error.
export const addFavorite = (listingId: number) =>
  request("/api/favorite_listings", { method: "POST", body: { listingId }, schema: z.unknown() });

export const removeFavorite = (listingId: number) =>
  request(`/api/favorite_listings/${listingId}`, { method: "DELETE", schema: z.unknown() });

export const savedSorts = ["recent", "price_asc", "price_desc"] as const;

export type SavedSort = (typeof savedSorts)[number];

// A saved listing keeps its place after it leaves the market, with its status.
const savedListingSchema = listingCardSchema.extend({
  status: listingStatusSchema,
  car: listingCardSchema.shape.car.unwrap().extend({ makeId: z.number(), modelId: z.number() }).nullable(),
});

export type SavedListing = z.infer<typeof savedListingSchema>;

const savedListingsSchema = z.object({
  listings: z.array(savedListingSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
  // Every saved listing, whatever the filter.
  counts: z.object({ all: z.number(), inspected: z.number() }),
});

export type SavedListings = z.infer<typeof savedListingsSchema>;

export type SavedListingsFilter = {
  // Only inspected cars, or only the others.
  inspected?: boolean;
  sort: SavedSort;
  page: number;
  limit: number;
};

export const getSavedListings = ({ inspected, sort, page, limit }: SavedListingsFilter) => {
  const query = new URLSearchParams({ sort, page: String(page), limit: String(limit) });
  if (inspected !== undefined) {
    query.set("inspected", String(inspected));
  }
  return request(`/api/favorite_listings?${query}`, { schema: savedListingsSchema });
};
