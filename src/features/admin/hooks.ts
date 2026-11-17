import { useQuery } from "@tanstack/react-query";
import { getOverview } from "./api";

export const adminKeys = {
  all: ["admin"] as const,
  overview: ["admin", "overview"] as const,
};

// Refreshed every minute, so the menu's counts follow what others decide.
export const useAdminOverview = () =>
  useQuery({ queryKey: adminKeys.overview, queryFn: getOverview, refetchInterval: 60_000 });
