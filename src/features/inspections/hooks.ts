import { useMutation, useQuery } from "@tanstack/react-query";
import { getCityGarages, requestInspection } from "./api";

export const useCityGarages = (cityId: number, enabled: boolean) =>
  useQuery({
    queryKey: ["garages", "city", cityId],
    queryFn: () => getCityGarages(cityId),
    enabled,
  });

export const useRequestInspection = () => useMutation({ mutationFn: requestInspection });
