import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { uploadToPresignedPost } from "../../lib/api/upload";
import { addMedia, confirmMedia, deleteMedia } from "./api";
import { listingKey } from "./hooks";
import { checkFiles, mediaKind, uniqueNames } from "./media";
import type { MediaKind, RefusedFile } from "./media";

export type Upload = {
  key: number;
  name: string;
  kind: MediaKind;
  previewUrl: string;
  // From 0 to 1.
  progress: number;
};

// Files that never became media, and why.
export type MediaProblem = {
  name: string;
  reason: RefusedFile["reason"] | "failed" | "rejected";
};

// Uploads picked files to a draft's car: reserve storage, upload each file,
// then confirm. Files that fail to upload are deleted, so they don't count
// towards the limit. The listing is refreshed after each batch.
export const useMediaUploads = (listingId: number) => {
  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [problems, setProblems] = useState<MediaProblem[]>([]);
  const [error, setError] = useState<unknown>(null);
  const nextKey = useRef(0);
  const previewUrls = useRef(new Set<string>());

  useEffect(() => {
    const urls = previewUrls.current;
    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const setProgress = (key: number, progress: number) =>
    setUploads((current) => current.map((item) => (item.key === key ? { ...item, progress } : item)));

  const upload = async (files: File[], slotsLeft: number) => {
    const { accepted, refused } = checkFiles(files, slotsLeft);
    setProblems(refused);
    setError(null);
    if (accepted.length === 0) {
      return;
    }

    const batch = accepted.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.add(previewUrl);
      nextKey.current += 1;
      return { key: nextKey.current, name: file.name, kind: mediaKind(file.name) ?? "image", previewUrl, progress: 0 };
    });
    setUploads((current) => [...current, ...batch]);

    try {
      const reserved = await addMedia({ id: listingId, names: uniqueNames(accepted.map(({ name }) => name)) });
      // The API answers in the order of the request.
      const results = await Promise.all(
        reserved.map((media, index) => {
          const file = accepted[index];
          const item = batch[index];
          return file && item
            ? uploadToPresignedPost(media.upload, file, (progress) => setProgress(item.key, progress))
            : Promise.resolve(false);
        }),
      );
      const failed = reserved.filter((_, index) => !results[index]);
      if (failed.length > 0) {
        await deleteMedia({ id: listingId, mediaIds: failed.map(({ id }) => id) }).catch(() => undefined);
      }
      const confirmed = results.some(Boolean) ? await confirmMedia(listingId) : null;
      // Problems name the file as the seller picked it.
      const outcomes = reserved.map(({ filename }, index) => ({
        name: accepted[index]?.name ?? filename,
        reason: !results[index]
          ? ("failed" as const)
          : confirmed?.rejected.includes(filename)
            ? ("rejected" as const)
            : null,
      }));
      setProblems((current) => [
        ...current,
        ...outcomes.flatMap(({ name, reason }) => (reason ? [{ name, reason }] : [])),
      ]);
    } catch (caught) {
      setError(caught);
    } finally {
      await queryClient.invalidateQueries({ queryKey: listingKey(listingId) });
      const keys = new Set(batch.map(({ key }) => key));
      setUploads((current) => current.filter(({ key }) => !keys.has(key)));
      for (const { previewUrl } of batch) {
        URL.revokeObjectURL(previewUrl);
        previewUrls.current.delete(previewUrl);
      }
    }
  };

  return { uploads, problems, error, upload };
};
