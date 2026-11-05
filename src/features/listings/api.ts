import { z } from "zod";
import { request } from "../../lib/api/client";

export const listingStatuses = [
  "draft",
  "pending",
  "approved",
  "withdrawn",
  "rejected",
  "sold",
] as const;

export const listingStatusSchema = z.enum(listingStatuses);

export type ListingStatus = z.infer<typeof listingStatusSchema>;

const carSummarySchema = z.object({
  id: z.number(),
  price: z.number(),
  year: z.number(),
  distance: z.string(),
  carMedias: z.array(
    z.object({
      id: z.number(),
      type: z.enum(["image", "video"]),
      link: z.string(),
      isPrimary: z.boolean(),
    }),
  ),
});

const sellerListingSchema = z.object({
  id: z.number(),
  title: z.string(),
  status: listingStatusSchema,
  rejectionReason: z.string().nullable(),
  updatedAt: z.string(),
  car: carSummarySchema.nullable(),
  completedInspectionsCount: z.number(),
});

export type SellerListing = z.infer<typeof sellerListingSchema>;

const myListingsSchema = z.object({
  listings: z.array(sellerListingSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    statusCounts: z.record(listingStatusSchema, z.number()),
  }),
});

export type MyListings = z.infer<typeof myListingsSchema>;

export type MyListingsFilter = {
  status?: ListingStatus;
  page: number;
};

export const getMyListings = ({ status, page }: MyListingsFilter) => {
  const query = new URLSearchParams({ page: String(page) });
  if (status) {
    query.set("status", status);
  }
  return request(`/api/listings/mine?${query}`, { schema: myListingsSchema });
};

const deletedListingSchema = z.object({
  deleted: z.literal(true),
  listingId: z.number(),
});

export const deleteListing = (id: number) =>
  request(`/api/listings/${id}`, {
    method: "DELETE",
    schema: deletedListingSchema,
  });
