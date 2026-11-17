import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuditLog, getOverview } from "./api";
import type { AuditLogQuery } from "./api";
import { getInspections } from "./inspectionsApi";
import type { InspectionsQuery } from "./inspectionsApi";
import { approveListing, deleteListing, getListings, rejectListing } from "./listingsApi";
import type { ListingsQuery } from "./listingsApi";
import { deleteUser, getUser, getUsers, reactivateUser, suspendUser } from "./usersApi";
import type { AdminUser } from "./usersApi";
import type { UsersQuery } from "./usersApi";
import { decideVerification, getVerification, getVerifications } from "./verificationsApi";
import { getWorkshops } from "./workshopsApi";
import type { WorkshopsQuery } from "./workshopsApi";

export const adminKeys = {
  all: ["admin"] as const,
  overview: ["admin", "overview"] as const,
  auditLog: (query: AuditLogQuery) => ["admin", "audit-log", query] as const,
  verifications: ["admin", "verifications"] as const,
  verification: (userId: number) => ["admin", "verifications", userId] as const,
  users: (query: UsersQuery) => ["admin", "users", query] as const,
  user: (userId: number) => ["admin", "user", userId] as const,
  listings: (query: ListingsQuery) => ["admin", "listings", query] as const,
  workshops: (query: WorkshopsQuery) => ["admin", "workshops", query] as const,
  inspections: (query: InspectionsQuery) => ["admin", "inspections", query] as const,
};

// Refreshed every minute, so the menu's counts follow what others decide.
export const useAdminOverview = () =>
  useQuery({ queryKey: adminKeys.overview, queryFn: getOverview, refetchInterval: 60_000 });

export const useAuditLog = (query: AuditLogQuery) =>
  useQuery({ queryKey: adminKeys.auditLog(query), queryFn: () => getAuditLog(query), placeholderData: keepPreviousData });

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

// After a change to an account: its page shows the new state, and the lists,
// counts and audit log are fetched again.
const useAccountChange = <Input,>(mutationFn: (input: Input) => Promise<AdminUser>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (user) => {
      queryClient.setQueryData(adminKeys.user(user.id), user);
      void queryClient.invalidateQueries({
        queryKey: adminKeys.all,
        predicate: (query) => query.queryKey[1] !== "user",
      });
    },
  });
};

export const useSuspendUser = () => useAccountChange(suspendUser);

export const useReactivateUser = () => useAccountChange(reactivateUser);

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: ({ userId }) => {
      queryClient.removeQueries({ queryKey: adminKeys.user(userId) });
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
};

export const useAdminListings = (query: ListingsQuery) =>
  useQuery({ queryKey: adminKeys.listings(query), queryFn: () => getListings(query), placeholderData: keepPreviousData });

// Deleting, approving or rejecting a listing changes the lists and the counts.
const useListingChange = <Input, Output>(mutationFn: (input: Input) => Promise<Output>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  });
};

export const useDeleteListing = () => useListingChange(deleteListing);

export const useApproveListing = () => useListingChange(approveListing);

export const useRejectListing = () => useListingChange(rejectListing);

export const useAdminWorkshops = (query: WorkshopsQuery) =>
  useQuery({ queryKey: adminKeys.workshops(query), queryFn: () => getWorkshops(query), placeholderData: keepPreviousData });

export const useAdminInspections = (query: InspectionsQuery) =>
  useQuery({
    queryKey: adminKeys.inspections(query),
    queryFn: () => getInspections(query),
    placeholderData: keepPreviousData,
  });
