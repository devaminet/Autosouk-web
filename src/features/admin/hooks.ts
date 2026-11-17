import { useQuery } from "@tanstack/react-query";
import { getAuditLog, getOverview } from "./api";
import type { AuditLogQuery } from "./api";

export const adminKeys = {
  all: ["admin"] as const,
  overview: ["admin", "overview"] as const,
  auditLog: (query: AuditLogQuery) => ["admin", "audit-log", query] as const,
};

// Refreshed every minute, so the menu's counts follow what others decide.
export const useAdminOverview = () =>
  useQuery({ queryKey: adminKeys.overview, queryFn: getOverview, refetchInterval: 60_000 });

export const useAuditLog = (query: AuditLogQuery) =>
  useQuery({ queryKey: adminKeys.auditLog(query), queryFn: () => getAuditLog(query) });
