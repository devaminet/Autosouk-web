import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { replaceProfileImage } from "./api";
import { updateSessionUser } from "./session";

// Replaces the signed-in user's photo, with progress, and lets them stop it.
export const useProfilePhotoUpload = () => {
  const { t } = useTranslation("auth");
  const [progress, setProgress] = useState(0);
  const controller = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: async (photo: File) => {
      controller.current?.abort();
      const current = new AbortController();
      controller.current = current;
      setProgress(0);
      const imageUrl = await replaceProfileImage(photo, setProgress, current.signal);
      if (imageUrl === null && !current.signal.aborted) {
        throw new Error(t("account.photo.failed"));
      }
      return imageUrl;
    },
    onSuccess: (imageUrl) => {
      if (imageUrl) {
        updateSessionUser({ imageUrl });
      }
    },
  });

  // Leaving the page stops the upload.
  useEffect(() => () => controller.current?.abort(), []);

  return {
    upload: mutation.mutate,
    // The photo being uploaded, while it is.
    photo: mutation.isPending ? mutation.variables : null,
    progress,
    error: mutation.error,
    cancel: () => {
      controller.current?.abort();
      mutation.reset();
    },
  };
};
