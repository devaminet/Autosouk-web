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

const auditEntrySchema = z.object({
  id: z.number(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.number(),
  details: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
  actor: z.object({ id: z.number(), firstName: z.string(), lastName: z.string() }).nullable(),
});

export type AuditEntry = z.infer<typeof auditEntrySchema>;

const auditLogSchema = z.object({
  entries: z.array(auditEntrySchema),
  // Every action in the log, for the filter.
  actions: z.array(z.string()),
  meta: pageMetaSchema,
});

export type AuditLogQuery = {
  page?: number;
  limit?: number;
  action?: string;
  targetType?: string;
  // Numbers, or the text of a filter read from the link.
  targetId?: number | string;
  actorId?: number | string;
};

// Builds a query string from the values set, leaving out the empty ones.
export const queryString = (query: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }
  const text = params.toString();
  return text ? `?${text}` : "";
};

// Who saw or decided what, newest first.
export const getAuditLog = (query: AuditLogQuery = {}) =>
  request(`/api/admin/audit-log${queryString(query)}`, { schema: auditLogSchema });
