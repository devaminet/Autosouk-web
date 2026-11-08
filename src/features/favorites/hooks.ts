import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addFavorite, getFavoriteIds, getSavedCarsInCity, getSavedListings, removeFavorite } from "./api";
import type { SavedListingsFilter } from "./api";

const favoritesKey = ["favorites"];
const favoriteIdsKey = [...favoritesKey, "ids"];

// A page of the buyer's saved listings. Keeps the current page on screen while
// another filter or page loads.
export const useSavedListings = (filter: SavedListingsFilter) =>
  useQuery({
    queryKey: [...favoritesKey, "list", filter],
    queryFn: () => getSavedListings(filter),
    placeholderData: keepPreviousData,
  });

// The buyer's saved cars in a city, to choose one to inspect.
export const useSavedCarsInCity = (cityId: number, enabled: boolean) =>
  useQuery({
    queryKey: [...favoritesKey, "city", cityId],
    queryFn: () => getSavedCarsInCity(cityId),
    enabled,
  });

// The listings the buyer keeps. Only buyers have favourites.
export const useFavoriteIds = (enabled: boolean) =>
  useQuery({
    queryKey: favoriteIdsKey,
    queryFn: getFavoriteIds,
    enabled,
    select: (ids) => new Set(ids),
  });

// Adds or removes a favourite. The heart changes at once, and changes back if
// the API refuses.
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, favorite }: { listingId: number; favorite: boolean }) =>
      favorite ? addFavorite(listingId) : removeFavorite(listingId),
    onMutate: async ({ listingId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: favoriteIdsKey });
      const previous = queryClient.getQueryData<number[]>(favoriteIdsKey);
      queryClient.setQueryData<number[]>(favoriteIdsKey, (ids = []) =>
        favorite ? [...ids, listingId] : ids.filter((id) => id !== listingId),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(favoriteIdsKey, context?.previous);
    },
    // The hearts, and the saved list, which loses or gains the listing.
    onSettled: () => queryClient.invalidateQueries({ queryKey: favoritesKey }),
  });
};
