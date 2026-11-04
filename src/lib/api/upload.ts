export type PresignedPost = {
  url: string;
  fields: Record<string, string>;
};

// Uploads directly to storage. The policy requires its fields first and the
// file last, under the name "file".
export const uploadToPresignedPost = async (
  { url, fields }: PresignedPost,
  file: File,
): Promise<boolean> => {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    form.append(name, value);
  }
  form.append("file", file);

  try {
    const response = await fetch(url, { method: "POST", body: form });
    return response.ok;
  } catch {
    return false;
  }
};
