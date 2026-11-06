// The API's media rules. It checks them again, so these only spare a round trip.
export const maxMediaCount = 20;
export const minImageCount = 3;

const megabyte = 1024 * 1024;

export type MediaKind = "image" | "video";

const kinds: Record<MediaKind, { extensions: readonly string[]; maxBytes: number }> = {
  image: { extensions: ["jpg", "jpeg", "png", "webp"], maxBytes: 10 * megabyte },
  video: { extensions: ["mp4"], maxBytes: 50 * megabyte },
};

// For the file picker's accept attribute.
export const acceptedFiles = Object.values(kinds)
  .flatMap(({ extensions }) => extensions.map((extension) => `.${extension}`))
  .join(",");

const extensionOf = (name: string) => name.slice(name.lastIndexOf(".") + 1).toLowerCase();

// The API decides the kind from the extension, so the client does too.
export const mediaKind = (name: string): MediaKind | null => {
  const extension = extensionOf(name);
  if (kinds.image.extensions.includes(extension)) {
    return "image";
  }
  return kinds.video.extensions.includes(extension) ? "video" : null;
};

export type RefusedFile = {
  name: string;
  reason: "type" | "size" | "limit";
};

// Splits picked files into those to upload and those refused, with the reason.
export const checkFiles = (files: File[], slotsLeft: number) => {
  const accepted: File[] = [];
  const refused: RefusedFile[] = [];
  for (const file of files) {
    const kind = mediaKind(file.name);
    if (!kind) {
      refused.push({ name: file.name, reason: "type" });
    } else if (file.size > kinds[kind].maxBytes) {
      refused.push({ name: file.name, reason: "size" });
    } else if (accepted.length >= slotsLeft) {
      refused.push({ name: file.name, reason: "limit" });
    } else {
      accepted.push(file);
    }
  }
  return { accepted, refused };
};

// The API refuses two files with the same name, ignoring case, in one request.
// Only the extension matters to it, so a number is added to repeated names.
export const uniqueNames = (names: string[]): string[] => {
  const used = new Set<string>();
  return names.map((name) => {
    const dot = name.lastIndexOf(".");
    const base = dot > 0 ? name.slice(0, dot) : name;
    const extension = dot > 0 ? name.slice(dot) : "";
    let candidate = name;
    for (let copy = 2; used.has(candidate.toLowerCase()); copy += 1) {
      candidate = `${base}-${copy}${extension}`;
    }
    used.add(candidate.toLowerCase());
    return candidate;
  });
};
