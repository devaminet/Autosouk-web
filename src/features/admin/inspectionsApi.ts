import { z } from "zod";
import { request } from "../../lib/api/client";
import { inspectionStatuses, verdicts } from "../inspections/api";
import { pageMetaSchema, queryString } from "./api";

const adminInspectionSchema = z.object({
  id: z.number(),
  status: z.enum(inspectionStatuses),
  verdict: z.enum(verdicts).nullable(),
  overallScore: z.number().nullable(),
  priceAtRequest: z.number(),
  requestedAt: z.string(),
  acceptedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  hasReport: z.boolean(),
  buyer: z.object({ id: z.number(), firstName: z.string(), lastName: z.string() }),
  mechanic: z.object({ id: z.number(), name: z.string() }),
  // A deleted car keeps the name it had when the buyer asked.
  car: z.object({
    id: z.number().nullable(),
    listingId: z.number().nullable(),
    year: z.number().nullable(),
    make: z.string().nullable(),
    model: z.string().nullable(),
    removed: z.boolean(),
  }),
});

export type AdminInspection = z.infer<typeof adminInspectionSchema>;

const inspectionsSchema = z.object({ inspections: z.array(adminInspectionSchema), meta: pageMetaSchema });

export type InspectionsQuery = { page?: number; status?: string; mechanicId?: string; buyerId?: string };

// Every inspection, newest request first.
export const getInspections = (query: InspectionsQuery) =>
  request(`/api/admin/inspections${queryString(query)}`, { schema: inspectionsSchema });
