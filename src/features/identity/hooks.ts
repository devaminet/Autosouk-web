import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateSessionUser } from "../auth/session";
import { getIdentityState, sendIdentityVideo, sendPhoneCode, startIdentityCheck, verifyPhoneCode } from "./api";
import type { IdentityState, StartedCheck } from "./api";

const identityKey = ["identity", "me"];

export const useSendPhoneCode = () => useMutation({ mutationFn: sendPhoneCode });

export const useVerifyPhoneCode = () =>
  useMutation({
    mutationFn: verifyPhoneCode,
    onSuccess: () => updateSessionUser({ phoneVerified: true }),
  });

export const useIdentityState = () => useQuery({ queryKey: identityKey, queryFn: getIdentityState });

export const useStartIdentityCheck = () => useMutation({ mutationFn: startIdentityCheck });

export const useSendIdentityVideo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      check,
      video,
      onProgress,
    }: {
      check: StartedCheck;
      video: Blob;
      onProgress: (fraction: number) => void;
    }) => sendIdentityVideo(check, video, onProgress),
    onSuccess: (sent) => {
      if (sent) {
        updateSessionUser({ identityStatus: "pending" });
        queryClient.setQueryData<IdentityState>(identityKey, (state) =>
          state ? { ...state, identityStatus: "pending" } : state,
        );
      }
    },
  });
};
