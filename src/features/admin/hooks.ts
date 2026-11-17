import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuditLog, getOverview } from "./api";
import type { AuditLogQuery } from "./api";
import { getUser, getUsers } from "./usersApi";
import type { UsersQuery } from "./usersApi";
import { decideVerification, getVerification, getVerifications } from "./verificationsApi";

export const adminKeys = {
  all: ["admin"] as const,
  overview: ["admin", "overview"] as const,
  auditLog: (query: AuditLogQuery) => ["admin", "audit-log", query] as const,
  verifications: ["admin", "verifications"] as const,
  verification: (userId: number) => ["admin", "verifications", userId] as const,
  users: (query: UsersQuery) => ["admin", "users", query] as const,
  user: (userId: number) => ["admin", "user", userId] as const,
};

// Refreshed every minute, so the menu's counts follow what others decide.
export const useAdminOverview = () =>
  useQuery({ queryKey: adminKeys.overview, queryFn: getOverview, refetchInterval: 60_000 });

export const useAuditLog = (query: AuditLogQuery) =>
  useQuery({ queryKey: adminKeys.auditLog(query), queryFn: () => getAuditLog(query) });

export const useVerifications = () => useQuery({ queryKey: adminKeys.verifications, queryFn: getVerifications });

// Loading a review hands out a logged video link, so it isn't fetched again
// on focus; the link lasts 10 minutes.
export const useVerification = (userId: number | null) =>
  useQuery({
    queryKey: adminKeys.verification(userId ?? 0),
    queryFn: () => getVerification(userId ?? 0),
    enabled: userId !== null,
    staleTime: 9 * 60_000,
    refetchOnWindowFocus: false,
  });

export const useDecideVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: decideVerification,
    onSuccess: (review) => {
      queryClient.setQueryData(adminKeys.verification(review.user.id), review);
      void queryClient.invalidateQueries({ queryKey: adminKeys.verifications, exact: true });
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview });
      void queryClient.invalidateQueries({ queryKey: adminKeys.all, predicate: (query) => query.queryKey[1] === "audit-log" });
    },
  });
};

// The previous page stays on screen while the next one loads.
export const useUsers = (query: UsersQuery) =>
  useQuery({ queryKey: adminKeys.users(query), queryFn: () => getUsers(query), placeholderData: keepPreviousData });

export const useAdminUser = (userId: number | null) =>
  useQuery({ queryKey: adminKeys.user(userId ?? 0), queryFn: () => getUser(userId ?? 0), enabled: userId !== null });
