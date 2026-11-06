import { useDeleteMedia, useSetCover } from "./hooks";

// Deleting uploaded media and choosing the cover. Neither changes the status.
export const useMediaActions = (listingId: number) => {
  const deletion = useDeleteMedia();
  const cover = useSetCover();
  const busyIds = [
    ...(deletion.isPending ? (deletion.variables?.mediaIds ?? []) : []),
    ...(cover.isPending && cover.variables ? [cover.variables.mediaId] : []),
  ];
  const errors = [deletion.error, cover.error].flatMap((item) => (item ? [item.message] : []));

  return {
    busyIds,
    errors,
    remove: (mediaId: number) => deletion.mutate({ id: listingId, mediaIds: [mediaId] }),
    makeCover: (mediaId: number) => cover.mutate({ id: listingId, mediaId }),
  };
};
