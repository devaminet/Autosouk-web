import { z } from "zod";
import { request } from "../../lib/api/client";
import { identityStatuses } from "../auth/api";
import { documentSchema, documentTypes, mechanicKinds, verificationStatuses } from "./api";
import type { DocumentType } from "./api";

const reviewsSchema = z.object({
  reviews: z.array(
    z.object({
      user: z.object({ id: z.number(), firstName: z.string(), lastName: z.string(), email: z.string() }),
      kind: z.enum(mechanicKinds).nullable(),
      mechanic: z.object({ name: z.string(), city: z.string().nullable() }).nullable(),
      pendingCount: z.number(),
      submittedAt: z.string().nullable(),
      resent: z.boolean(),
    }),
  ),
});

export type ReviewSummary = z.infer<typeof reviewsSchema>["reviews"][number];

// The mechanics waiting for a decision, longest waiting first.
export const getReviews = async () =>
  (await request("/api/mechanic-documents/reviews", { schema: reviewsSchema })).reviews;

const reviewSchema = z.object({
  user: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phone: z.string(),
    phoneVerified: z.boolean(),
    identityStatus: z.enum(identityStatuses),
    createdAt: z.string(),
  }),
  mechanic: z.object({ id: z.number(), name: z.string(), address: z.string(), city: z.string().nullable() }).nullable(),
  kind: z.enum(mechanicKinds).nullable(),
  status: z.enum(verificationStatuses),
  bookable: z.boolean(),
  approvedAt: z.string().nullable(),
  validUntil: z.string().nullable(),
  requiredTypes: z.array(z.enum(documentTypes)),
  // The types that need an end date to be approved.
  expiringTypes: z.array(z.enum(documentTypes)),
  documents: z.array(documentSchema),
});

export type Review = z.infer<typeof reviewSchema>;

export const getReview = (userId: number) =>
  request(`/api/mechanic-documents/reviews/${userId}`, { schema: reviewSchema });

const linkSchema = z.object({ url: z.string(), contentType: z.string(), expiresAt: z.string() });

export type DocumentLink = z.infer<typeof linkSchema>;

// A short link to the file. The API writes every link it gives to the audit log.
export const getDocumentLink = (documentId: number) =>
  request(`/api/mechanic-documents/documents/${documentId}/link`, { schema: linkSchema });

export type Decision = {
  documentId: number;
  decision: "approved" | "rejected";
  reason?: string;
  validUntil?: string;
};

export const decideDocuments = ({ userId, decisions }: { userId: number; decisions: Decision[] }) =>
  request(`/api/mechanic-documents/reviews/${userId}/decisions`, {
    method: "POST",
    body: { decisions },
    schema: reviewSchema,
  });

// Reasons the admin starts from, translated by the page.
export const rejectionPresets = ["expired", "unreadable", "nameMismatch", "wrongDocument"] as const;

export const needsDate = (review: Review, type: DocumentType) => review.expiringTypes.includes(type);
