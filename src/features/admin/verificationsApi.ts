import { z } from "zod";
import { request } from "../../lib/api/client";
import { identityStatuses } from "../auth/api";
import { challengeSlugs } from "../identity/api";
import { documentSchema, documentTypes, mechanicKinds, verificationStatuses } from "../documents/api";

export const roles = ["buyer", "seller", "mechanic", "admin"] as const;

export type Role = (typeof roles)[number];

const queueSchema = z.object({
  verifications: z.array(
    z.object({
      user: z.object({
        id: z.number(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
        role: z.enum(roles),
      }),
      mechanic: z.object({ name: z.string(), kind: z.enum(mechanicKinds).nullable() }).nullable(),
      waiting: z.object({ faceCheck: z.boolean(), documents: z.number() }),
      since: z.string().nullable(),
      resent: z.boolean(),
    }),
  ),
});

export type QueuedVerification = z.infer<typeof queueSchema>["verifications"][number];

// Everyone with a face video or documents waiting, longest waiting first.
export const getVerifications = async () =>
  (await request("/api/admin/verifications", { schema: queueSchema })).verifications;

const verificationSchema = z.object({
  user: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phone: z.string(),
    role: z.enum(roles),
    emailVerified: z.boolean().nullable(),
    phoneVerifiedAt: z.string().nullable(),
    identityStatus: z.enum(identityStatuses),
    locale: z.string(),
    city: z.object({ name: z.string(), slug: z.string() }).nullable(),
    suspendedAt: z.string().nullable(),
    createdAt: z.string(),
  }),
  // The face check waiting, with a 10-minute link to its video.
  faceCheck: z
    .object({
      id: z.number(),
      challenges: z.array(z.enum(challengeSlugs)),
      submittedAt: z.string().nullable(),
      contentType: z.string(),
      videoUrl: z.string(),
    })
    .nullable(),
  faceCheckHistory: z.array(
    z.object({
      id: z.number(),
      status: z.enum(["approved", "rejected"]),
      submittedAt: z.string().nullable(),
      reviewedAt: z.string().nullable(),
      rejectionReason: z.string().nullable(),
    }),
  ),
  attempts: z.object({ rejected: z.number(), max: z.number() }),
  mechanic: z
    .object({ id: z.number(), name: z.string(), city: z.object({ name: z.string(), slug: z.string() }) })
    .nullable(),
  // A mechanic's documents, as the documents review shows them.
  documents: z
    .object({
      kind: z.enum(mechanicKinds).nullable(),
      status: z.enum(verificationStatuses),
      bookable: z.boolean(),
      validUntil: z.string().nullable(),
      requiredTypes: z.array(z.enum(documentTypes)),
      expiringTypes: z.array(z.enum(documentTypes)),
      documents: z.array(documentSchema),
    })
    .nullable(),
});

export type Verification = z.infer<typeof verificationSchema>;

// Everything one person sent. The API writes each video link it gives to the audit log.
export const getVerification = (userId: number) =>
  request(`/api/admin/verifications/${userId}`, { schema: verificationSchema });

export type FaceDecision = { decision: "approved" | "rejected"; reason?: string };

export type DocumentDecision = {
  documentId: number;
  decision: "approved" | "rejected";
  reason?: string;
  validUntil?: string;
};

// Decides everything waiting at once: the face video and every document.
export const decideVerification = ({
  userId,
  faceCheck,
  documents,
}: {
  userId: number;
  faceCheck?: FaceDecision;
  documents?: DocumentDecision[];
}) =>
  request(`/api/admin/verifications/${userId}/decision`, {
    method: "POST",
    body: { ...(faceCheck ? { faceCheck } : {}), ...(documents ? { documents } : {}) },
    schema: verificationSchema,
  });

// Reasons the admin starts from when rejecting a face video, translated by the page.
export const facePresets = ["tooDark", "faceHidden", "challengeMissed", "notLive"] as const;
