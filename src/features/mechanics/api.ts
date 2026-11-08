import { z } from "zod";
import { ApiError, request } from "../../lib/api/client";
import { uploadToPresignedPost } from "../../lib/api/upload";

const uploadSchema = z.object({
  url: z.string(),
  fields: z.record(z.string(), z.string()),
});

const mechanicSchema = z.object({
  id: z.number(),
  name: z.string(),
  cityId: z.number(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  description: z.string().nullable(),
  phone: z.string().nullable(),
  // In MAD, paid at the garage.
  inspectionPrice: z.number().nullable(),
  profileImageUrl: z.string().nullable(),
  // Whether buyers can find the garage and ask it for inspections.
  isActive: z.boolean(),
  city: z.object({ id: z.number(), name: z.string(), slug: z.string() }),
  garageImages: z.array(z.object({ id: z.number(), link: z.string() })),
});

export type Mechanic = z.infer<typeof mechanicSchema>;

// The most garage photos a workshop can show, as the API allows.
export const maxGaragePhotos = 12;

const profileSchema = z.object({ mechanic: mechanicSchema });

// The signed-in mechanic's workshop, or null before they set it up.
export const getOwnMechanic = async (): Promise<Mechanic | null> => {
  try {
    return (await request("/api/mechanics/me", { schema: profileSchema })).mechanic;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
};

export type WorkshopDetails = {
  name: string;
  phone: string | null;
  inspectionPrice: number | null;
  description: string | null;
  cityId: number | null;
  address: string;
  // Null until the mechanic places the pin. The API then says it's missing.
  latitude: number | null;
  longitude: number | null;
};

// A new logo to upload, or "remove" to go back to the initials.
export type LogoChange = File | "remove" | null;

const savedSchema = z.object({
  mechanic: mechanicSchema,
  profileImageUpload: uploadSchema.optional(),
});

// Creating a profile can't clear a detail, so it leaves out the empty ones.
const withoutEmpty = (details: WorkshopDetails) =>
  Object.fromEntries(Object.entries(details).filter(([, value]) => value !== null));

const logoField = (logo: LogoChange) => {
  if (logo === "remove") {
    return { profileImageFilename: null };
  }
  return logo ? { profileImageFilename: logo.name } : {};
};

// Creates or updates the workshop, then uploads its new logo, if any.
export const saveWorkshop = async ({
  details,
  logo,
  isNew,
  logoFailedMessage,
}: {
  details: WorkshopDetails;
  logo: LogoChange;
  isNew: boolean;
  // Shown when the details are saved but the logo upload fails.
  logoFailedMessage: string;
}): Promise<Mechanic> => {
  const { mechanic, profileImageUpload } = await request(isNew ? "/api/mechanics" : "/api/mechanics/me", {
    method: isNew ? "POST" : "PATCH",
    body: { ...(isNew ? withoutEmpty(details) : details), ...logoField(logo) },
    schema: savedSchema,
  });
  if (logo instanceof File && profileImageUpload) {
    const uploaded = await uploadToPresignedPost(profileImageUpload, logo);
    if (!uploaded) {
      throw new Error(logoFailedMessage);
    }
  }
  return mechanic;
};

export const setAcceptingRequests = async (isActive: boolean): Promise<Mechanic> =>
  (
    await request("/api/mechanics/me/status", {
      method: "PATCH",
      body: { isActive },
      schema: profileSchema,
    })
  ).mechanic;

const addedPhotosSchema = z.object({
  garageImages: z.array(z.object({ id: z.number(), upload: uploadSchema })),
});

// Reserves the photos, then uploads them side by side. Returns how many
// uploads failed.
export const addGaragePhotos = async (photos: File[]): Promise<number> => {
  const { garageImages } = await request("/api/mechanics/me/garage-images", {
    method: "POST",
    body: { filenames: photos.map(({ name }) => name) },
    schema: addedPhotosSchema,
  });
  const results = await Promise.all(
    garageImages.map(async ({ id, upload }, index) => {
      const photo = photos[index];
      const uploaded = photo ? await uploadToPresignedPost(upload, photo) : false;
      // A photo that never arrived would show as broken, so it goes.
      if (!uploaded) {
        await removeGaragePhoto(id).catch(() => undefined);
      }
      return uploaded;
    }),
  );
  return results.filter((uploaded) => !uploaded).length;
};

export const removeGaragePhoto = (imageId: number) =>
  request(`/api/mechanics/me/garage-images/${imageId}`, {
    method: "DELETE",
    schema: z.unknown(),
  });

const rankedGarageSchema = z.object({
  mechanicId: z.number(),
  name: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  // In MAD, paid at the garage. Null when the garage hasn't set it.
  inspectionPrice: z.number().nullable(),
  profileImageLink: z.string().nullable(),
  // From 1 to 5. Null without reviews.
  averageRating: z.number().nullable(),
  reviewCount: z.number(),
});

export type RankedGarage = z.infer<typeof rankedGarageSchema>;

const rankingsSchema = z.object({
  rankings: z.array(rankedGarageSchema),
  meta: z.object({ total: z.number(), page: z.number(), limit: z.number(), totalPages: z.number() }),
});

export type Rankings = z.infer<typeof rankingsSchema>;

// Garages per page of the rankings.
export const rankingsPageSize = 20;

// The garages of a city that accept requests, best rated first.
export const getRankings = ({ cityId, page }: { cityId: number; page: number }): Promise<Rankings> =>
  request(`/api/mechanics/rankings?cityId=${cityId}&page=${page}&limit=${rankingsPageSize}`, {
    schema: rankingsSchema,
    anonymous: true,
  });

const ratingSummarySchema = z.object({
  // From 1 to 5. Null without reviews.
  average: z.number().nullable(),
  count: z.number(),
  // How many reviews give each number of stars.
  distribution: z.object({ 1: z.number(), 2: z.number(), 3: z.number(), 4: z.number(), 5: z.number() }),
});

export type RatingSummary = z.infer<typeof ratingSummarySchema>;

// A workshop as buyers see it. Its own mechanic also sees it while hidden.
const publicMechanicSchema = mechanicSchema.extend({ userId: z.number(), rating: ratingSummarySchema });

export type PublicMechanic = z.infer<typeof publicMechanicSchema>;

export const getMechanic = async (mechanicId: number): Promise<PublicMechanic> =>
  (
    await request(`/api/mechanics/${mechanicId}`, {
      schema: z.object({ mechanic: publicMechanicSchema }),
    })
  ).mechanic;

const reviewSchema = z.object({
  id: z.number(),
  rating: z.number(),
  message: z.string().nullable(),
  createdAt: z.string(),
  // Left out of the buyer's own review.
  buyer: z.object({ id: z.number(), name: z.string() }).optional(),
});

export type Review = z.infer<typeof reviewSchema>;

const reviewsSchema = z.object({
  reviews: z.array(reviewSchema),
  rating: ratingSummarySchema,
  meta: z.object({ total: z.number(), page: z.number(), limit: z.number(), totalPages: z.number() }),
});

export type ReviewsPage = z.infer<typeof reviewsSchema>;

// Reviews per page, newest first.
export const reviewsPageSize = 10;

export const getReviews = (mechanicId: number, page: number): Promise<ReviewsPage> =>
  request(`/api/mechanics/${mechanicId}/reviews?page=${page}&limit=${reviewsPageSize}`, {
    schema: reviewsSchema,
    anonymous: true,
  });

const ownReviewSchema = z.object({ review: reviewSchema });

// The signed-in buyer's review of the workshop, or null before they write one.
export const getOwnReview = async (mechanicId: number): Promise<Review | null> => {
  try {
    return (await request(`/api/mechanics/${mechanicId}/reviews/me`, { schema: ownReviewSchema })).review;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
};

export type ReviewDraft = {
  rating: number;
  message: string;
};

// Writes the buyer's review, or changes the one they wrote.
export const saveReview = async ({
  mechanicId,
  draft,
  isNew,
}: {
  mechanicId: number;
  draft: ReviewDraft;
  isNew: boolean;
}): Promise<Review> =>
  (
    await request(isNew ? `/api/mechanics/${mechanicId}/reviews` : `/api/mechanics/${mechanicId}/reviews/me`, {
      method: isNew ? "POST" : "PATCH",
      body: { rating: draft.rating, message: draft.message.trim() },
      schema: ownReviewSchema,
    })
  ).review;

export const deleteReview = (mechanicId: number) =>
  request(`/api/mechanics/${mechanicId}/reviews/me`, { method: "DELETE", schema: z.unknown() });
