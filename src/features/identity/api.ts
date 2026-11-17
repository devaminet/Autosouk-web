import { z } from "zod";
import { request } from "../../lib/api/client";
import { uploadToPresignedPost } from "../../lib/api/upload";
import type { PresignedPost } from "../../lib/api/upload";
import { identityStatuses } from "../auth/api";
import type { AuthUser } from "../auth/api";

const sentCodeSchema = z.object({
  phone: z.string(),
  expiresAt: z.string(),
  // When a new code may be asked for.
  resendAt: z.string(),
});

export type SentCode = z.infer<typeof sentCodeSchema>;

// Texts a 6-digit code to the signed-in user's phone.
export const sendPhoneCode = () =>
  request("/api/auth/phone/code", { method: "POST", schema: sentCodeSchema });

const verifiedPhoneSchema = z.object({ user: z.unknown() });

// Checks the code. The session then holds the verified phone.
export const verifyPhoneCode = async (code: string) => {
  await request("/api/auth/phone/verify", { method: "POST", body: { code }, schema: verifiedPhoneSchema });
};

const identityStateSchema = z.object({
  phoneVerified: z.boolean(),
  identityStatus: z.enum(identityStatuses),
  attemptsLeft: z.number(),
  rejectionReason: z.string().nullable(),
});

export type IdentityState = z.infer<typeof identityStateSchema>;

export const getIdentityState = () => request("/api/identity/me", { schema: identityStateSchema });

// The moves asked of the user, in order. Slugs from the enums catalog.
export const challengeSlugs = [
  "look_straight",
  "turn_left",
  "turn_right",
  "look_up",
  "look_down",
  "smile",
  "blink",
] as const;

export type Challenge = (typeof challengeSlugs)[number];

const startedCheckSchema = z.object({
  verification: z.object({
    id: z.number(),
    challenges: z.array(z.enum(challengeSlugs)).min(1),
    expiresAt: z.string(),
  }),
  upload: z.object({ url: z.string(), fields: z.record(z.string(), z.string()) }),
  attemptsLeft: z.number(),
});

export type StartedCheck = z.infer<typeof startedCheckSchema>;

export const videoTypes = ["video/webm", "video/mp4"] as const;

export type VideoType = (typeof videoTypes)[number];

export const startIdentityCheck = (contentType: VideoType) =>
  request("/api/identity/verifications", {
    method: "POST",
    body: { contentType },
    schema: startedCheckSchema,
  });

const submittedSchema = z.object({ identityStatus: z.literal("pending") });

// Uploads the video, then sends it to review. Returns false when the upload
// didn't reach storage.
export const sendIdentityVideo = async (
  check: StartedCheck,
  video: Blob,
  onProgress: (fraction: number) => void,
): Promise<boolean> => {
  const file = new File([video], check.upload.fields.key ?? "identity", { type: video.type });
  const uploaded = await uploadToPresignedPost(check.upload satisfies PresignedPost, file, onProgress);
  if (!uploaded) {
    return false;
  }
  await request(`/api/identity/verifications/${check.verification.id}/submit`, {
    method: "POST",
    schema: submittedSchema,
  });
  return true;
};

// Where the user goes next to finish the checks, or null when nothing is
// left to do on their side. Admins don't take the checks.
export const nextVerificationStep = (user: AuthUser): "phone" | "face" | null => {
  if (user.role === "admin") {
    return null;
  }
  if (!user.phoneVerified) {
    return "phone";
  }
  return user.identityStatus === "not_submitted" ? "face" : null;
};

// Whether the user may sell, ask for inspections, inspect and review.
export const isFullyVerified = (user: AuthUser): boolean =>
  user.role === "admin" || (user.phoneVerified && user.identityStatus === "approved");

// The phone is verified and the face video sent, even if not reviewed yet.
// Mechanics may send their documents from then on.
export const hasSentFaceCheck = (user: AuthUser): boolean =>
  user.role === "admin" ||
  (user.phoneVerified && (user.identityStatus === "pending" || user.identityStatus === "approved"));
