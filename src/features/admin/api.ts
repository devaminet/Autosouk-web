import { z } from "zod";
import { request } from "../../lib/api/client";

// The page a list is on, as every admin list sends it.
export const pageMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export type PageMeta = z.infer<typeof pageMetaSchema>;

const countsSchema = z.record(z.string(), z.number());

const overviewSchema = z.object({
  users: z.object({
    total: z.number(),
    byRole: z.object({ buyer: z.number(), seller: z.number(), mechanic: z.number(), admin: z.number() }),
    suspended: z.number(),
  }),
  listings: z.object({ byStatus: countsSchema }),
  mechanics: z.object({ total: z.number(), bookable: z.number() }),
  inspections: z.object({ byStatus: countsSchema }),
  queues: z.object({
    verifications: z.number(),
    listings: z.number(),
    identityChecks: z.number(),
    mechanicDocuments: z.number(),
  }),
});

export type Overview = z.infer<typeof overviewSchema>;

// Counts across the whole site, and what waits for an admin.
export const getOverview = () => request("/api/admin/overview", { schema: overviewSchema });
