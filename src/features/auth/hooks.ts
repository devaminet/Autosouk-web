import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  changePassword,
  completeTwoFactor,
  getDevices,
  isChallenge,
  resendTwoFactorCode,
  setTwoFactor,
  signOutDevice,
  getCities,
  login,
  logout,
  register,
  requestPasswordReset,
  resendVerification,
  setNewPassword,
} from "./api";
import type { RegisterInput } from "./api";
import { endSession, refreshSession, sessionKey, startSession, updateSessionUser } from "./session";

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

// Starts the session at once, unless the API asks for a code first.
export const useLogin = () =>
  useMutation({
    mutationFn: login,
    onSuccess: (result) => {
      if (!isChallenge(result)) {
        startSession(result);
      }
    },
  });

export const useCompleteTwoFactor = () =>
  useMutation({ mutationFn: completeTwoFactor, onSuccess: startSession });

export const useResendTwoFactorCode = () => useMutation({ mutationFn: resendTwoFactorCode });

const devicesKey = ["devices"];

export const useDevices = () => useQuery({ queryKey: devicesKey, queryFn: getDevices });

export const useSignOutDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signOutDevice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: devicesKey }),
  });
};

export const useSetTwoFactor = () =>
  useMutation({
    mutationFn: setTwoFactor,
    onSuccess: (user) => updateSessionUser({ twoFactorEnabled: user.twoFactorEnabled }),
  });

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
