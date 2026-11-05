import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { deleteListing, getMyListings } from "./api";
import type { MyListingsFilter } from "./api";

const myListingsKey = ["listings", "mine"];

// Keeps the current page on screen while another status or page loads.
export const useMyListings = (filter: MyListingsFilter) =>
  useQuery({
    queryKey: [...myListingsKey, filter],
    queryFn: () => getMyListings(filter),
    placeholderData: keepPreviousData,
  });

// Refreshes after a failure too: a 404 means the list on screen is out of date.
// Returning the promise keeps the mutation pending until the new list arrives.
export const useDeleteListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteListing,
    onSettled: () => queryClient.invalidateQueries({ queryKey: myListingsKey }),
  });
};
