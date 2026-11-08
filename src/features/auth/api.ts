import { z } from "zod";
import { request } from "../../lib/api/client";
import { uploadToPresignedPost } from "../../lib/api/upload";
import { locales } from "../../lib/locale";

const userSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  cityId: z.number().nullable(),
  imageUrl: z.string().nullable(),
  isVerified: z.boolean(),
  phone: z.string(),
  locale: z.enum(locales),
  role: z.enum(["buyer", "seller", "mechanic", "admin"]),
});

export type AuthUser = z.infer<typeof userSchema>;

const sessionSchema = z.object({
  accessToken: z.string(),
  user: userSchema,
});

export type Session = z.infer<typeof sessionSchema>;

const messageSchema = z.object({
  code: z.string(),
  message: z.string(),
});

const presignedPostSchema = z.object({
  url: z.string(),
  fields: z.record(z.string(), z.string()),
});

const registerResponseSchema = messageSchema.extend({
  imageUpload: presignedPostSchema.nullish(),
});

const citySchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  // The centre and how far the city reaches. Null without coordinates.
  latitude: z.number().nullable().default(null),
  longitude: z.number().nullable().default(null),
  radiusKm: z.number().nullable().default(null),
});

export type City = z.infer<typeof citySchema>;

const lookupsSchema = z.object({
  cities: z.array(citySchema),
});

export const signupRoles = ["buyer", "seller", "mechanic"] as const;

export type SignupRole = (typeof signupRoles)[number];

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  userType: SignupRole;
  cityId: number;
};

export const getCities = async (): Promise<City[]> => {
  const { cities } = await request("/api/lookups", { schema: lookupsSchema });
  return cities;
};

export const login = (input: { email: string; password: string }) =>
  request("/api/auth/login", {
    method: "POST",
    body: input,
    schema: sessionSchema,
    anonymous: true,
  });

export const postRefreshToken = () =>
  request("/api/auth/refresh-token", {
    method: "POST",
    schema: sessionSchema,
    anonymous: true,
  });

export const logout = () =>
  request("/api/auth/logout", {
    method: "POST",
    schema: messageSchema,
    anonymous: true,
  });

// A failed photo upload does not fail the signup: the account already exists.
export const register = async (
  input: RegisterInput,
  photo: File | null,
): Promise<{ photoFailed: boolean }> => {
  const { imageUpload } = await request("/api/auth/register", {
    method: "POST",
    body: photo ? { ...input, imageName: photo.name } : input,
    schema: registerResponseSchema,
    anonymous: true,
  });
  if (!photo || !imageUpload) {
    return { photoFailed: false };
  }
  const uploaded = await uploadToPresignedPost(imageUpload, photo);
  return { photoFailed: !uploaded };
};

export const resendVerification = (email: string) =>
  request("/api/auth/re-verify", {
    method: "POST",
    body: { email },
    schema: messageSchema,
    anonymous: true,
  });

export const requestPasswordReset = (email: string) =>
  request("/api/auth/forgot-password", {
    method: "POST",
    body: { email },
    schema: messageSchema,
    anonymous: true,
  });

export const setNewPassword = (input: { token: string; password: string }) =>
  request("/api/auth/forgot-password", {
    method: "PUT",
    body: input,
    schema: messageSchema,
    anonymous: true,
  });

export type ChangePasswordInput = {
  email: string;
  oldPassword: string;
  password: string;
  confirmPassword: string;
};

// The API finds the account by the email in the body, so it must be the
// signed-in user's own.
export const changePassword = (input: ChangePasswordInput) =>
  request("/api/auth/reset-password", {
    method: "PUT",
    body: input,
    schema: messageSchema,
  });

const profileImageUploadSchema = z.object({ imageUpload: presignedPostSchema });

const profileImageSchema = z.object({ imageUrl: z.string() });

// Reserves a new photo, uploads it to storage, then confirms it. The answer
// is the photo's new address. Returns null when the upload fails or stops.
export const replaceProfileImage = async (
  photo: File,
  onProgress: (fraction: number) => void,
  signal: AbortSignal,
): Promise<string | null> => {
  const { imageUpload } = await request("/api/auth/profile-image", {
    method: "POST",
    body: { imageName: photo.name },
    schema: profileImageUploadSchema,
  });
  const uploaded = await uploadToPresignedPost(imageUpload, photo, onProgress, signal);
  if (!uploaded) {
    return null;
  }
  const { imageUrl } = await request("/api/auth/profile-image/confirm", {
    method: "POST",
    schema: profileImageSchema,
  });
  return imageUrl;
};
