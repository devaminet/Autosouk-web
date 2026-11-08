import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  addGaragePhotos,
  deleteReview,
  getMechanic,
  getOwnMechanic,
  getOwnReview,
  getRankings,
  getReviews,
  saveReview,
  removeGaragePhoto,
  saveWorkshop,
  setAcceptingRequests,
} from "./api";
import type { LogoChange, Mechanic, ReviewDraft, WorkshopDetails } from "./api";

const ownKey = ["mechanics", "me"];

export const useOwnMechanic = () => useQuery({ queryKey: ownKey, queryFn: getOwnMechanic });

export const useSaveWorkshop = (isNew: boolean) => {
  const { t } = useTranslation("mechanics");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ details, logo }: { details: WorkshopDetails; logo: LogoChange }) =>
      saveWorkshop({ details, logo, isNew, logoFailedMessage: t("identity.logoFailed") }),
    onSuccess: (mechanic) => queryClient.setQueryData(ownKey, mechanic),
    // A failed logo upload follows a saved profile, so reload it either way.
    onError: () => queryClient.invalidateQueries({ queryKey: ownKey }),
  });
};

export const useAcceptingRequests = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setAcceptingRequests,
    onMutate: async (isActive) => {
      await queryClient.cancelQueries({ queryKey: ownKey });
      const previous = queryClient.getQueryData<Mechanic | null>(ownKey);
      if (previous) {
        queryClient.setQueryData(ownKey, { ...previous, isActive });
      }
      return { previous };
    },
    onError: (_error, _isActive, context) => queryClient.setQueryData(ownKey, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ownKey }),
  });
};

export const useAddGaragePhotos = () => {
  const { t } = useTranslation("mechanics");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (photos: File[]) => {
      const failed = await addGaragePhotos(photos);
      if (failed > 0) {
        throw new Error(t("photos.uploadFailed", { count: failed }));
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ownKey }),
  });
};

export const useRemoveGaragePhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeGaragePhoto,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ownKey }),
  });
};

// A city's rankings. The previous page stays on screen while the next loads,
// but never another city's garages.
export const useRankings = (cityId: number | null, page: number) =>
  useQuery({
    queryKey: ["mechanics", "rankings", cityId, page],
    queryFn: () => getRankings({ cityId: cityId ?? 0, page }),
    enabled: cityId !== null,
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === cityId ? previous : undefined,
  });

const mechanicKey = (mechanicId: number) => ["mechanics", mechanicId];

// A workshop's public profile, with its rating.
export const useMechanic = (mechanicId: number | null) =>
  useQuery({
    queryKey: mechanicKey(mechanicId ?? 0),
    queryFn: () => getMechanic(mechanicId ?? 0),
    enabled: mechanicId !== null,
  });

// A workshop's reviews, newest first, one page more at a time.
export const useReviews = (mechanicId: number) =>
  useInfiniteQuery({
    queryKey: [...mechanicKey(mechanicId), "reviews"],
    queryFn: ({ pageParam }) => getReviews(mechanicId, pageParam),
    initialPageParam: 1,
    getNextPageParam: ({ meta }) => (meta.page < meta.totalPages ? meta.page + 1 : undefined),
  });

// The signed-in buyer's review of the workshop. Only buyers write reviews.
export const useOwnReview = (mechanicId: number, enabled: boolean) =>
  useQuery({
    queryKey: [...mechanicKey(mechanicId), "reviews", "me"],
    queryFn: () => getOwnReview(mechanicId),
    enabled,
  });

// A review changes the workshop's rating, its reviews and the rankings.
const useAfterReview = (mechanicId: number) => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: mechanicKey(mechanicId) }),
      queryClient.invalidateQueries({ queryKey: ["mechanics", "rankings"] }),
    ]);
};

export const useSaveReview = (mechanicId: number, isNew: boolean) => {
  const refresh = useAfterReview(mechanicId);
  return useMutation({
    mutationFn: (draft: ReviewDraft) => saveReview({ mechanicId, draft, isNew }),
    onSuccess: refresh,
  });
};

export const useDeleteReview = (mechanicId: number) => {
  const refresh = useAfterReview(mechanicId);
  return useMutation({ mutationFn: () => deleteReview(mechanicId), onSuccess: refresh });
};
