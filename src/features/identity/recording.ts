import type { VideoType } from "./api";

export type RecordingFormat = {
  // What MediaRecorder records in.
  mimeType: string;
  // What the API stores the video as.
  contentType: VideoType;
};

// Chrome and Firefox record WebM; Safari only MP4.
const formats: RecordingFormat[] = [
  { mimeType: "video/webm;codecs=vp8", contentType: "video/webm" },
  { mimeType: "video/webm", contentType: "video/webm" },
  { mimeType: "video/mp4", contentType: "video/mp4" },
];

// The first format this browser can record, or null when it can't record.
export const pickRecordingFormat = (): RecordingFormat | null => {
  if (typeof MediaRecorder === "undefined") {
    return null;
  }
  return formats.find(({ mimeType }) => MediaRecorder.isTypeSupported(mimeType)) ?? null;
};

// How long the user has for each challenge.
export const challengeMs = 3000;

// "+212612345678" becomes "+212 6 •• •• 56 78", so the screen shows which
// number got the code without showing all of it.
export const maskPhone = (phone: string): string => {
  const digits = phone.replace(/\D/gu, "");
  if (digits.length < 8) {
    return phone;
  }
  const last = digits.slice(-4);
  const country = phone.startsWith("+") ? `+${digits.slice(0, 3)} ${digits.slice(3, 4)}` : digits.slice(0, 2);
  return `${country} •• •• ${last.slice(0, 2)} ${last.slice(2)}`;
};
