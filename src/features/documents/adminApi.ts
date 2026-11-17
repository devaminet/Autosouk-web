import { z } from "zod";
import { request } from "../../lib/api/client";

const linkSchema = z.object({ url: z.string(), contentType: z.string(), expiresAt: z.string() });

export type DocumentLink = z.infer<typeof linkSchema>;

// A short link to the file. The API writes every link it gives to the audit log.
export const getDocumentLink = (documentId: number) =>
  request(`/api/mechanic-documents/documents/${documentId}/link`, { schema: linkSchema });

// Reasons the admin starts from when rejecting a document, translated by the page.
export const rejectionPresets = ["expired", "unreadable", "nameMismatch", "wrongDocument"] as const;
