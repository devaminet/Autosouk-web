import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { paths } from "../../lib/paths";
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
  register,
  requestPasswordReset,
  resendVerification,
  setNewPassword,
} from "./api";
import type { RegisterInput } from "./api";
import {
  clearSessionRevoked,
  endRevokedSession,
  endSession,
  isLoggingOut,
  logOut,
  refreshSession,
  sessionKey,
  sessionRevokedKey,
  startSession,
  updateSessionUser,
} from "./session";
import { watchSession } from "./sessionEvents";

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

export const useLogout = () => useMutation({ mutationFn: logOut, onSuccess: endSession });

// Ends the session in this tab as soon as the API ends it: the device was
// signed out from another one, another tab logged out, or every session ended.
// Clears the user's data and goes to the login page, which leads back here.
// Also keeps the list of signed-in devices up to date.
export const useSessionEvents = () => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const here = useRef("");
  // The page the session ended on, until the redirect to log in.
  const endedOn = useRef<string | null>(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    here.current = `${pathname}${search}`;
    if (pathname !== paths.login) {
      clearSessionRevoked();
    }
  }, [pathname, search]);

  useEffect(() => {
    if (userId === null) {
      // Goes to log in once the session is gone, as the login page would send
      // a signed-in user away. Pages that need a user redirect there too.
      const from = endedOn.current;
      if (from !== null) {
        endedOn.current = null;
        void navigate(paths.login, { replace: true, state: { from } });
      }
      return undefined;
    }
    return watchSession({
      onEnded: () => {
        // This tab's own logout ends the session itself.
        if (isLoggingOut()) {
          return;
        }
        endedOn.current = here.current;
        endRevokedSession();
      },
      // A device signed in or out: the account page's list reloads.
      onDevicesChanged: () => {
        void queryClient.invalidateQueries({ queryKey: devicesKey });
      },
    });
  }, [userId, queryClient, navigate]);
};

// True when the API ended the session from elsewhere.
export const useSessionRevoked = () =>
  useQuery({
    queryKey: sessionRevokedKey,
    queryFn: () => false,
    initialData: false,
    staleTime: Number.POSITIVE_INFINITY,
  }).data;

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
