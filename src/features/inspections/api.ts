import { z } from "zod";
import { request } from "../../lib/api/client";

const garageSchema = z.object({
  mechanicId: z.number(),
  name: z.string(),
  address: z.string(),
  // In MAD, paid at the garage. Null when the garage hasn't set it.
  inspectionPrice: z.number().nullable(),
  // From 1 to 5. Null without reviews.
  averageRating: z.number().nullable(),
  reviewCount: z.number(),
});

export type Garage = z.infer<typeof garageSchema>;

const rankingsSchema = z.object({ rankings: z.array(garageSchema) });

// The most garages one city offers to choose from.
const garageLimit = 20;

// The active garages of a city, best rated first.
export const getCityGarages = async (cityId: number): Promise<Garage[]> =>
  (
    await request(`/api/mechanics/rankings?cityId=${cityId}&limit=${garageLimit}`, {
      schema: rankingsSchema,
      anonymous: true,
    })
  ).rankings;

export const requestInspection = (input: { carId: number; mechanicId: number }) =>
  request("/api/inspections", { method: "POST", body: input, schema: z.unknown() });
