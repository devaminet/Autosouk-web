import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addFavorite, getFavoriteIds, removeFavorite } from "./api";

const favoriteIdsKey = ["favorites", "ids"];

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
    onSettled: () => queryClient.invalidateQueries({ queryKey: favoriteIdsKey }),
  });
};
