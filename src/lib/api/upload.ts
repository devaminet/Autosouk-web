export type PresignedPost = {
  url: string;
  fields: Record<string, string>;
};

// The policy may only fix the start of the type, such as "image/". The file's
// own type is more precise, and storage serves the file with it.
const contentType = (fields: Record<string, string>, file: File) => {
  const allowed = fields["Content-Type"];
  return allowed !== undefined && file.type.startsWith(allowed) ? file.type : allowed;
};

// Uploads directly to storage. The policy requires its fields first and the
// file last, under the name "file". XMLHttpRequest, unlike fetch, reports
// upload progress, as a fraction from 0 to 1. Aborting the signal stops the
// upload, which then counts as failed.
export const uploadToPresignedPost = (
  { url, fields }: PresignedPost,
  file: File,
  onProgress?: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<boolean> => {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    form.append(name, name === "Content-Type" ? (contentType(fields, file) ?? value) : value);
  }
  form.append("file", file);

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    // Listening to upload events makes a cross-origin request ask permission
    // first, so the listener is only added when someone wants the progress.
    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && event.total > 0) {
          onProgress(event.loaded / event.total);
        }
      });
    }
    xhr.addEventListener("load", () => resolve(xhr.status >= 200 && xhr.status < 300));
    xhr.addEventListener("error", () => resolve(false));
    xhr.addEventListener("abort", () => resolve(false));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.open("POST", url);
    xhr.send(form);
  });
};
