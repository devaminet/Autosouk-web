import { z } from "zod";
import { request } from "../../lib/api/client";

// The API's largest page of favourites.
const pageSize = 100;

// Only the ids matter here: they mark the hearts on listing cards.
const favoritesPageSchema = z.object({
  listings: z.array(z.object({ listingId: z.number() })),
});

// Every listing the buyer keeps, read page by page. The API counts pages from
// 1 in its `offset` parameter.
export const getFavoriteIds = async (): Promise<number[]> => {
  const ids: number[] = [];
  for (let page = 1; ; page += 1) {
    const { listings } = await request(`/api/favorite_listings?limit=${pageSize}&offset=${page}`, {
      schema: favoritesPageSchema,
    });
    ids.push(...listings.map(({ listingId }) => listingId));
    if (listings.length < pageSize) {
      return ids;
    }
  }
};

export const addFavorite = (listingId: number) =>
  request("/api/favorite_listings", { method: "POST", body: { listingId }, schema: z.unknown() });

export const removeFavorite = (listingId: number) =>
  request(`/api/favorite_listings/${listingId}`, { method: "DELETE", schema: z.unknown() });
