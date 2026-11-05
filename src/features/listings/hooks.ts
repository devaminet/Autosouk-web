import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getMyListings } from "./api";
import type { MyListingsFilter } from "./api";

// Keeps the current page on screen while another status or page loads.
export const useMyListings = (filter: MyListingsFilter) =>
  useQuery({
    queryKey: ["listings", "mine", filter],
    queryFn: () => getMyListings(filter),
    placeholderData: keepPreviousData,
  });
