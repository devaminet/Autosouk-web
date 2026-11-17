import { z } from "zod";
import { request } from "../../lib/api/client";
import { pageMetaSchema, queryString } from "./api";

export const listingStatuses = ["draft", "pending", "approved", "withdrawn", "rejected", "sold"] as const;

export type ListingStatus = (typeof listingStatuses)[number];

const adminListingSchema = z.object({
  id: z.number(),
  title: z.string(),
  status: z.enum(listingStatuses).nullable(),
  rejectionReason: z.string().nullable(),
  approvedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  seller: z
    .object({
      id: z.number(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
      suspendedAt: z.string().nullable(),
    })
    .nullable(),
  // A draft has no car yet.
  car: z
    .object({
      id: z.number(),
      price: z.number().nullable(),
      year: z.number().nullable(),
      make: z.string().nullable(),
      model: z.string().nullable(),
      city: z.string().nullable(),
    })
    .nullable(),
});

export type AdminListing = z.infer<typeof adminListingSchema>;

const listingsSchema = z.object({ listings: z.array(adminListingSchema), meta: pageMetaSchema });

export type ListingsQuery = { page?: number; search?: string; status?: string; sellerId?: string };

// Every listing in every status, newest first.
export const getListings = (query: ListingsQuery) =>
  request(`/api/admin/listings${queryString(query)}`, { schema: listingsSchema });

// Deletes the listing, its car and media. Buyers keep the car's inspection reports.
export const deleteListing = ({ listingId, reason }: { listingId: number; reason: string }) =>
  request(`/api/admin/listings/${listingId}`, {
    method: "DELETE",
    body: { reason },
    schema: z.object({ deleted: z.boolean(), listingId: z.number() }),
  });

// Publishes a pending listing. The API refuses one without a car or with too
// few photos, and says why.
export const approveListing = (listingId: number) =>
  request(`/api/listings/${listingId}/approve`, {
    method: "PATCH",
    schema: z.object({ updatedRows: z.unknown() }),
  });

// Sends a pending listing back to its seller, who sees the reason. Editing it
// puts it back in the queue.
export const rejectListing = ({ listingId, reason }: { listingId: number; reason: string }) =>
  request(`/api/listings/${listingId}/reject`, {
    method: "PATCH",
    body: { reason },
    schema: z.object({ listing: z.object({ id: z.number() }) }),
  });
