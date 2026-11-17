import { z } from "zod";
import { request } from "../../lib/api/client";
import { identityStatuses } from "../auth/api";
import { mechanicKinds, verificationStatuses } from "../documents/api";
import { pageMetaSchema, queryString } from "./api";
import { roles } from "./verificationsApi";

const userSummarySchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string(),
  role: z.enum(roles),
  emailVerified: z.boolean().nullable(),
  phoneVerifiedAt: z.string().nullable(),
  identityStatus: z.enum(identityStatuses),
  suspendedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type UserSummary = z.infer<typeof userSummarySchema>;

const usersSchema = z.object({ users: z.array(userSummarySchema), meta: pageMetaSchema });

export type UsersQuery = {
  page?: number;
  search?: string;
  role?: string;
  status?: string;
  identityStatus?: string;
};

// Every account, newest first.
export const getUsers = (query: UsersQuery) =>
  request(`/api/admin/users${queryString(query)}`, { schema: usersSchema });

const historyEntrySchema = z.object({
  id: z.number(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.number(),
  details: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
  actor: z.object({ id: z.number(), firstName: z.string(), lastName: z.string() }).nullable(),
});

const citySchema = z.object({ name: z.string(), slug: z.string() });

export const userSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string(),
  role: z.enum(roles),
  imageUrl: z.string().nullable().catch(null),
  isVerified: z.boolean().nullable(),
  phoneVerifiedAt: z.string().nullable(),
  twoFactorEnabled: z.boolean(),
  identityStatus: z.enum(identityStatuses),
  locale: z.string(),
  suspendedAt: z.string().nullable(),
  suspensionReason: z.string().nullable(),
  createdAt: z.string(),
  city: citySchema.nullable(),
  signedInDevices: z.number(),
  listings: z.object({ byStatus: z.record(z.string(), z.number()) }),
  inspectionsRequested: z.number(),
  mechanic: z
    .object({
      id: z.number(),
      name: z.string(),
      isActive: z.boolean(),
      inspectionPrice: z.number().nullable(),
      city: citySchema,
      inspections: z.number(),
      verification: z
        .object({
          kind: z.enum(mechanicKinds).nullable(),
          status: z.enum(verificationStatuses),
          bookable: z.boolean(),
          validUntil: z.string().nullable(),
        })
        .nullable(),
    })
    .nullable(),
  // The latest audit entries about the account, newest first.
  history: z.array(historyEntrySchema),
});

export type AdminUser = z.infer<typeof userSchema>;

export const getUser = (userId: number) => request(`/api/admin/users/${userId}`, { schema: userSchema });

// The user can't sign in, is signed out now and hidden from buyers. They get
// an email with the reason.
export const suspendUser = ({ userId, reason }: { userId: number; reason: string }) =>
  request(`/api/admin/users/${userId}/suspend`, { method: "POST", body: { reason }, schema: userSchema });

export const reactivateUser = (userId: number) =>
  request(`/api/admin/users/${userId}/reactivate`, { method: "POST", schema: userSchema });

// Deletes the account and what it owns. The reason goes to the audit log.
export const deleteUser = ({ userId, reason }: { userId: number; reason: string }) =>
  request(`/api/admin/users/${userId}`, {
    method: "DELETE",
    body: { reason },
    schema: z.object({ deleted: z.boolean(), userId: z.number() }),
  });
