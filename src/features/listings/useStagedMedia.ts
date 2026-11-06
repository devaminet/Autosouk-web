import { useEffect, useRef, useState } from "react";
import { deleteMedia } from "./api";
import { useConfirmMedia } from "./hooks";
import { checkFiles, mediaKind } from "./media";
import type { MediaKind } from "./media";
import { reserveAndUpload } from "./uploadMedia";
import type { MediaProblem } from "./useMediaUploads";

type PickedFile = {
  key: number;
  file: File;
  name: string;
  kind: MediaKind;
  previewUrl: string;
};

// A new file of a published listing, until it is confirmed or discarded.
export type StagedFile = PickedFile &
  (
    | { state: "uploading"; progress: number }
    | { state: "ready"; mediaId: number; filename: string }
    | { state: "failed" }
  );

const uploading = (item: PickedFile): StagedFile => ({ ...item, state: "uploading", progress: 0 });

// Confirming new media sends a published listing back to review, so new files
// wait until the seller confirms them all at once. They are uploaded already,
// and hidden from the listing until then. Leaving discards them, so they don't
// count towards the limit or get confirmed later by surprise.
export const useStagedMedia = (listingId: number) => {
  const confirmation = useConfirmMedia();
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [problems, setProblems] = useState<MediaProblem[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const nextKey = useRef(0);
  const latest = useRef(files);
  const mounted = useRef(true);

  useEffect(() => {
    latest.current = files;
  }, [files]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const ready = latest.current.flatMap((item) => (item.state === "ready" ? [item.mediaId] : []));
      if (ready.length > 0) {
        void deleteMedia({ id: listingId, mediaIds: ready }).catch(() => undefined);
      }
      for (const { previewUrl } of latest.current) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [listingId]);

  const update = (key: number, change: (item: StagedFile) => StagedFile) =>
    setFiles((current) => current.map((item) => (item.key === key ? change(item) : item)));

  const forget = (keys: number[]) => {
    setFiles((current) => {
      for (const item of current) {
        if (keys.includes(item.key)) {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
      return current.filter(({ key }) => !keys.includes(key));
    });
  };

  const send = async (batch: PickedFile[]) => {
    let results: Awaited<ReturnType<typeof reserveAndUpload>> = [];
    try {
      results = await reserveAndUpload(
        listingId,
        batch.map(({ file }) => file),
        (index, progress) => {
          const item = batch[index];
          if (item) {
            update(item.key, (current) => (current.state === "uploading" ? { ...current, progress } : current));
          }
        },
      );
    } catch (caught) {
      setError(caught);
    }
    // The seller left while the files uploaded, so nobody can confirm them.
    if (!mounted.current) {
      const ready = results.flatMap(({ mediaId, uploaded }) => (uploaded ? [mediaId] : []));
      if (ready.length > 0) {
        await deleteMedia({ id: listingId, mediaIds: ready }).catch(() => undefined);
      }
      return;
    }
    batch.forEach((item, index) => {
      const result = results[index];
      update(item.key, (current): StagedFile =>
        result?.uploaded
          ? { ...item, state: "ready", mediaId: result.mediaId, filename: result.filename }
          : { ...current, state: "failed" },
      );
    });
  };

  const add = (picked: File[], slotsLeft: number) => {
    const { accepted, refused } = checkFiles(picked, slotsLeft);
    setProblems(refused);
    setError(null);
    if (accepted.length === 0) {
      return;
    }
    const batch = accepted.map((file) => {
      nextKey.current += 1;
      return {
        key: nextKey.current,
        file,
        name: file.name,
        kind: mediaKind(file.name) ?? "image",
        previewUrl: URL.createObjectURL(file),
      };
    });
    setFiles((current) => [...current, ...batch.map(uploading)]);
    void send(batch);
  };

  // A failed file has no storage left, so it starts again from the beginning.
  const retry = (key: number) => {
    const item = files.find((file) => file.key === key);
    if (item?.state !== "failed") {
      return;
    }
    setError(null);
    update(key, uploading);
    void send([item]);
  };

  // Removes one new file. A ready file comes back if the API can't delete it,
  // as it would otherwise be confirmed with the others.
  const remove = async (key: number) => {
    const item = files.find((file) => file.key === key);
    if (!item || item.state === "uploading") {
      return;
    }
    setError(null);
    if (item.state === "failed") {
      forget([key]);
      return;
    }
    setFiles((current) => current.filter((file) => file.key !== key));
    try {
      await deleteMedia({ id: listingId, mediaIds: [item.mediaId] });
      URL.revokeObjectURL(item.previewUrl);
    } catch (caught) {
      setError(caught);
      setFiles((current) => [...current, item]);
    }
  };

  const ready = files.flatMap((item) => (item.state === "ready" ? [item] : []));
  const settled = files.filter(({ state }) => state !== "uploading").map(({ key }) => key);

  const discard = async () => {
    setError(null);
    setProblems([]);
    setIsDiscarding(true);
    try {
      if (ready.length > 0) {
        await deleteMedia({ id: listingId, mediaIds: ready.map(({ mediaId }) => mediaId) });
      }
      forget(settled);
    } catch (caught) {
      setError(caught);
    } finally {
      setIsDiscarding(false);
    }
  };

  // Resolves to true once the files show on the listing.
  const confirm = async () => {
    setError(null);
    setProblems([]);
    try {
      const result = await confirmation.mutateAsync(listingId);
      // Files storage doesn't have are of no use, and would block the limit.
      const missing = result.pending.map(({ id }) => id);
      if (missing.length > 0) {
        await deleteMedia({ id: listingId, mediaIds: missing }).catch(() => undefined);
      }
      setProblems(
        ready.flatMap(({ name, filename, mediaId }): MediaProblem[] => {
          if (result.rejected.includes(filename)) {
            return [{ name, reason: "rejected" }];
          }
          return missing.includes(mediaId) ? [{ name, reason: "failed" }] : [];
        }),
      );
      forget(ready.map(({ key }) => key));
      return true;
    } catch (caught) {
      setError(caught);
      return false;
    }
  };

  return {
    files,
    problems,
    error,
    isConfirming: confirmation.isPending,
    isDiscarding,
    add,
    retry,
    remove: (key: number) => void remove(key),
    discard: () => void discard(),
    confirm,
  };
};
