import { uploadToPresignedPost } from "../../lib/api/upload";
import { addMedia, deleteMedia } from "./api";
import { uniqueNames } from "./media";

export type UploadedFile = {
  // The name the seller picked.
  name: string;
  mediaId: number;
  // The name in storage, which confirm answers with.
  filename: string;
  uploaded: boolean;
};

// Reserves storage for each file and uploads it, without confirming. Files
// that fail are deleted again, so they don't count towards the limit. The
// result follows the order of the files.
export const reserveAndUpload = async (
  listingId: number,
  files: File[],
  onProgress: (index: number, fraction: number) => void,
): Promise<UploadedFile[]> => {
  const reserved = await addMedia({ id: listingId, names: uniqueNames(files.map(({ name }) => name)) });
  // The API answers in the order of the request.
  const results = await Promise.all(
    reserved.map((media, index) => {
      const file = files[index];
      return file
        ? uploadToPresignedPost(media.upload, file, (fraction) => onProgress(index, fraction))
        : Promise.resolve(false);
    }),
  );
  const failed = reserved.filter((_, index) => !results[index]);
  if (failed.length > 0) {
    await deleteMedia({ id: listingId, mediaIds: failed.map(({ id }) => id) }).catch(() => undefined);
  }
  return reserved.map((media, index) => ({
    name: files[index]?.name ?? media.filename,
    mediaId: media.id,
    filename: media.filename,
    uploaded: results[index] === true,
  }));
};
