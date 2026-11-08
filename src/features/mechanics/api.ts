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
