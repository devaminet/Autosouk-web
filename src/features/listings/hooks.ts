import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  attachCar,
  confirmMedia,
  createListing,
  deleteListing,
  deleteMedia,
  getEquipment,
  getListing,
  getLookups,
  getMakes,
  getModels,
  getMyListings,
  getPublicListings,
  setCover,
  submitListing,
  updateListing,
} from "./api";
import type { MyListingsFilter, PublicListingsFilter } from "./api";

const listingsKey = ["listings"];
const myListingsKey = [...listingsKey, "mine"];
export const listingKey = (id: number | null) => [...listingsKey, "detail", id];

// Keeps the current page on screen while another status or page loads.
export const useMyListings = (filter: MyListingsFilter) =>
  useQuery({
    queryKey: [...myListingsKey, filter],
    queryFn: () => getMyListings(filter),
    placeholderData: keepPreviousData,
  });

// Keeps the current results on screen while the next ones load.
export const usePublicListings = (filter: PublicListingsFilter) =>
  useQuery({
    queryKey: [...listingsKey, "public", filter],
    queryFn: () => getPublicListings(filter),
    placeholderData: keepPreviousData,
  });

// Waits while `ready` is false, such as until the session is known.
export const useListing = (id: number | null, ready = true) =>
  useQuery({
    queryKey: listingKey(id),
    queryFn: () => getListing(id ?? 0),
    enabled: id !== null && ready,
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

export const updateListingKey = [...listingsKey, "update"];

// The next step reads the listing, so wait until the cache is fresh.
export const useUpdateListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: updateListingKey,
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

// Media changes show on the draft's own page, so only that listing is refreshed.
export const useDeleteMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMedia,
    onSettled: (_data, _error, { id }) => queryClient.invalidateQueries({ queryKey: listingKey(id) }),
  });
};

export const useSetCover = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setCover,
    onSettled: (_data, _error, { id }) => queryClient.invalidateQueries({ queryKey: listingKey(id) }),
  });
};

// Confirming new media sends a published listing back to review, so the list
// changes too.
export const useConfirmMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmMedia,
    onSettled: () => queryClient.invalidateQueries({ queryKey: listingsKey }),
  });
};

export const useSubmitListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitListing,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listingsKey }),
  });
};
