import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  changePassword,
  getCities,
  login,
  logout,
  register,
  requestPasswordReset,
  resendVerification,
  setNewPassword,
} from "./api";
import type { RegisterInput } from "./api";
import { endSession, refreshSession, sessionKey, startSession } from "./session";

export const useSession = () => {
  const session = useQuery({
    queryKey: sessionKey,
    queryFn: refreshSession,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
  return { user: session.data ?? null, isPending: session.isPending };
};

export const useLogin = () =>
  useMutation({ mutationFn: login, onSuccess: startSession });

export const useLogout = () =>
  useMutation({ mutationFn: logout, onSuccess: endSession });

export const useRegister = () =>
  useMutation({
    mutationFn: ({ input, photo }: { input: RegisterInput; photo: File | null }) =>
      register(input, photo),
  });

export const useResendVerification = () =>
  useMutation({ mutationFn: resendVerification });

export const useRequestPasswordReset = () =>
  useMutation({ mutationFn: requestPasswordReset });

export const useChangePassword = () =>
  useMutation({ mutationFn: changePassword });

export const useSetNewPassword = () =>
  useMutation({ mutationFn: setNewPassword });

// The API sorts cities by their English name, so sort by the visible label.
export const useCityOptions = () => {
  const { t, i18n } = useTranslation("enums");
  const cities = useQuery({
    queryKey: ["cities"],
    queryFn: getCities,
    staleTime: 60 * 60 * 1000,
  });
  const options = (cities.data ?? [])
    .map(({ id, slug, name, latitude, longitude, radiusKm }) => ({
      id,
      label: t(`city.${slug}`, { defaultValue: name }),
      area:
        latitude === null || longitude === null || radiusKm === null
          ? null
          : { lat: latitude, lng: longitude, radiusKm },
    }))
    .sort((a, b) => a.label.localeCompare(b.label, i18n.language));

  return {
    options,
    isPending: cities.isPending,
    isError: cities.isError,
    retry: cities.refetch,
  };
};
