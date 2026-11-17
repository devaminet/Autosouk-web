import { z } from "zod";
import { request } from "../../lib/api/client";
import { uploadToPresignedPost } from "../../lib/api/upload";

export const mechanicKinds = ["solo", "garage"] as const;
export type MechanicKind = (typeof mechanicKinds)[number];

// Slugs from the API, translated by the mechanic_document_type enum.
export const documentTypes = ["cin_front", "cin_back", "rc", "patente", "ice", "premises"] as const;
export type DocumentType = (typeof documentTypes)[number];

// What each kind of mechanic sends, as the choice screen shows it.
export const documentsByKind: Record<MechanicKind, readonly DocumentType[]> = {
  solo: ["cin_front", "cin_back"],
  garage: ["cin_front", "cin_back", "rc", "patente", "ice", "premises"],
};

const documentStatuses = ["uploaded", "pending", "approved", "rejected"] as const;
export type DocumentStatus = (typeof documentStatuses)[number];

export const verificationStatuses = ["not_submitted", "pending", "approved", "rejected", "expired"] as const;
export type VerificationStatus = (typeof verificationStatuses)[number];

export const documentSchema = z.object({
  id: z.number(),
  type: z.enum(documentTypes),
  status: z.enum(documentStatuses),
  contentType: z.string(),
  sizeBytes: z.number().nullable(),
  validUntil: z.string().nullable(),
  expired: z.boolean(),
  rejectionReason: z.string().nullable(),
  submittedAt: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type MechanicDocument = z.infer<typeof documentSchema>;

const verificationSchema = z.object({
  kind: z.enum(mechanicKinds).nullable(),
  status: z.enum(verificationStatuses),
  bookable: z.boolean(),
  approvedAt: z.string().nullable(),
  validUntil: z.string().nullable(),
  requiredTypes: z.array(z.enum(documentTypes)),
  documents: z.array(documentSchema),
});

export type Verification = z.infer<typeof verificationSchema>;

export const getVerification = () => request("/api/mechanic-documents/me", { schema: verificationSchema });

export const chooseKind = (kind: MechanicKind) =>
  request("/api/mechanic-documents/me/kind", { method: "PUT", body: { kind }, schema: verificationSchema });

// The files the API takes, and their size limit.
export const acceptedTypes = ["image/jpeg", "image/png", "application/pdf"] as const;
type AcceptedType = (typeof acceptedTypes)[number];
export const maxFileBytes = 10 * 1024 * 1024;

export const isAcceptedType = (type: string): type is AcceptedType =>
  (acceptedTypes as readonly string[]).includes(type);

const startedUploadSchema = z.object({
  document: z.object({ id: z.number() }),
  upload: z.object({ url: z.string(), fields: z.record(z.string(), z.string()) }),
});

const confirmedSchema = z.object({ document: documentSchema });

// Thrown when the file didn't reach storage, so the page can say so.
export class UploadFailedError extends Error {
  constructor() {
    super("upload_failed");
    this.name = "UploadFailedError";
  }
}

// Asks for an upload link, sends the file straight to storage, then tells the
// API it arrived.
export const uploadDocument = async ({ type, file }: { type: DocumentType; file: File }) => {
  if (!isAcceptedType(file.type)) {
    throw new UploadFailedError();
  }
  const started = await request("/api/mechanic-documents/me/documents", {
    method: "POST",
    body: { type, contentType: file.type },
    schema: startedUploadSchema,
  });
  if (!(await uploadToPresignedPost(started.upload, file))) {
    throw new UploadFailedError();
  }
  const confirmed = await request(`/api/mechanic-documents/me/documents/${started.document.id}/confirm`, {
    method: "POST",
    schema: confirmedSchema,
  });
  return confirmed.document;
};

export const removeDocument = (id: number) =>
  request(`/api/mechanic-documents/me/documents/${id}`, { method: "DELETE", schema: z.unknown() });

export const submitDocuments = () =>
  request("/api/mechanic-documents/me/submit", { method: "POST", schema: verificationSchema });

// The document each required type shows: the newest one sent or stored.
export const currentDocuments = (verification: Verification) => {
  const current = new Map<DocumentType, MechanicDocument>();
  for (const document of verification.documents) {
    current.set(document.type, document);
  }
  return current;
};

// Whether a type is covered for sending: stored, waiting, or approved and valid.
export const isReady = (document: MechanicDocument | undefined) =>
  document !== undefined &&
  (document.status === "uploaded" || document.status === "pending" || (document.status === "approved" && !document.expired));

// Documents stored but not sent yet.
export const hasDrafts = (verification: Verification) =>
  verification.documents.some((document) => document.status === "uploaded");

// The kind can't change once the admin has documents of it.
export const isKindLocked = (verification: Verification) =>
  verification.documents.some((document) => document.status === "pending" || document.status === "approved");
