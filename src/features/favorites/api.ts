import { z } from "zod";
import { request } from "../../lib/api/client";

const favoriteIdsSchema = z.object({ listingIds: z.array(z.number()) });

// The ids of every listing the buyer keeps. They mark the hearts on cards.
export const getFavoriteIds = async (): Promise<number[]> =>
  (await request("/api/favorite_listings/ids", { schema: favoriteIdsSchema })).listingIds;

// Keeping a listing twice, or removing one that isn't kept, is not an error.
export const addFavorite = (listingId: number) =>
  request("/api/favorite_listings", { method: "POST", body: { listingId }, schema: z.unknown() });

export const removeFavorite = (listingId: number) =>
  request(`/api/favorite_listings/${listingId}`, { method: "DELETE", schema: z.unknown() });
