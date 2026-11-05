import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  attachCar,
  createListing,
  deleteListing,
  getEquipment,
  getListing,
  getLookups,
  getMakes,
  getModels,
  getMyListings,
  updateListing,
} from "./api";
import type { MyListingsFilter } from "./api";

const listingsKey = ["listings"];
const myListingsKey = [...listingsKey, "mine"];

// Keeps the current page on screen while another status or page loads.
export const useMyListings = (filter: MyListingsFilter) =>
  useQuery({
    queryKey: [...myListingsKey, filter],
    queryFn: () => getMyListings(filter),
    placeholderData: keepPreviousData,
  });

export const useListing = (id: number | null) =>
  useQuery({
    queryKey: [...listingsKey, "detail", id],
    queryFn: () => getListing(id ?? 0),
    enabled: id !== null,
  });

// Reference data changes with deployments, not while someone fills a form.
const reference = { staleTime: Infinity };

export const useLookups = () =>
  useQuery({ queryKey: ["lookups"], queryFn: getLookups, ...reference });

export const useMakes = () =>
  useQuery({ queryKey: ["makes"], queryFn: getMakes, ...reference });

export const useModels = (makeId: number | null) =>
  useQuery({
    queryKey: ["models", makeId],
    queryFn: () => getModels(makeId ?? 0),
    enabled: makeId !== null,
    ...reference,
  });

export const useEquipment = () =>
  useQuery({ queryKey: ["equipment"], queryFn: getEquipment, ...reference });

export const useCreateListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createListing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myListingsKey }),
  });
};

// The next step reads the listing, so wait until the cache is fresh.
export const useUpdateListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateListing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listingsKey }),
  });
};

export const useAttachCar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attachCar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listingsKey }),
  });
};

// Refreshes after a failure too: a 404 means the list on screen is out of date.
// Returning the promise keeps the mutation pending until the new list arrives.
export const useDeleteListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteListing,
    onSettled: () => queryClient.invalidateQueries({ queryKey: myListingsKey }),
  });
};
