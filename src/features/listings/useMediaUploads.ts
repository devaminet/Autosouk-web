import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { confirmMedia } from "./api";
import { listingKey } from "./hooks";
import { checkFiles, mediaKind } from "./media";
import type { MediaKind, RefusedFile } from "./media";
import { reserveAndUpload } from "./uploadMedia";

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

// Uploads picked files to a draft's car and confirms them at once, which keeps
// a draft a draft. The listing is refreshed after each batch.
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
      const files = await reserveAndUpload(listingId, accepted, (index, progress) => {
        const item = batch[index];
        if (item) {
          setProgress(item.key, progress);
        }
      });
      const confirmed = files.some(({ uploaded }) => uploaded) ? await confirmMedia(listingId) : null;
      // Problems name the file as the seller picked it.
      const outcomes = files.map(({ name, filename, uploaded }) => ({
        name,
        reason: !uploaded
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
