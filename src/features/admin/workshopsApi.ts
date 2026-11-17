import { z } from "zod";
import { request } from "../../lib/api/client";
import { pageMetaSchema, queryString } from "./api";

// The API's filters: buyers can book the workshop, can't, or its documents
// wait for review.
export const workshopStatuses = ["bookable", "not_bookable", "awaiting_review"] as const;

const adminWorkshopSchema = z.object({
  id: z.number(),
  name: z.string(),
  city: z.string(),
  isActive: z.boolean(),
  inspectionPrice: z.number().nullable(),
  bookable: z.boolean(),
  awaitingReview: z.boolean(),
  averageRating: z.number().nullable(),
  reviewsCount: z.number(),
  completedInspections: z.number(),
  createdAt: z.string(),
  user: z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    suspendedAt: z.string().nullable(),
  }),
});

export type AdminWorkshop = z.infer<typeof adminWorkshopSchema>;

const workshopsSchema = z.object({ mechanics: z.array(adminWorkshopSchema), meta: pageMetaSchema });

export type WorkshopsQuery = { page?: number; search?: string; status?: string; cityId?: string };

// Every workshop, newest first, bookable or not.
export const getWorkshops = (query: WorkshopsQuery) =>
  request(`/api/admin/mechanics${queryString(query)}`, { schema: workshopsSchema });
