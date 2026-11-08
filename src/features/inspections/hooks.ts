import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCityGarages, getQueue, moveInspection, requestInspection } from "./api";

export const useCityGarages = (cityId: number, enabled: boolean) =>
  useQuery({
    queryKey: ["garages", "city", cityId],
    queryFn: () => getCityGarages(cityId),
    enabled,
  });

export const useRequestInspection = () => useMutation({ mutationFn: requestInspection });

const queueKey = ["inspections", "queue"];

export const useQueue = (enabled: boolean) => useQuery({ queryKey: queueKey, queryFn: getQueue, enabled });

export const useMoveInspection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moveInspection,
    // Reload either way: a failed move may mean the buyer cancelled meanwhile.
    onSettled: () => queryClient.invalidateQueries({ queryKey: queueKey }),
  });
};
