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

export const inspectionStatuses = ["pending", "accepted", "rejected", "in_progress", "completed", "cancelled"] as const;

export type InspectionStatus = (typeof inspectionStatuses)[number];

const verdicts = ["excellent", "good", "fair", "poor"] as const;

const nameSchema = z.object({ name: z.string() }).nullable();

const queuedInspectionSchema = z.object({
  id: z.number(),
  status: z.enum(inspectionStatuses),
  // In MAD, as the garage charged when the buyer asked.
  priceAtRequest: z.number(),
  requestedAt: z.string(),
  acceptedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  verdict: z.enum(verdicts).nullable(),
  overallScore: z.number().nullable(),
  // A link to the PDF once the report is done.
  reportPdfLink: z.string().nullable(),
  car: z.object({
    id: z.number(),
    year: z.number(),
    make: nameSchema,
    model: nameSchema,
    listingId: z.number().nullable(),
    title: z.string().nullable(),
    photoUrl: z.string().nullable(),
    // Who shows the car to the mechanic.
    seller: z.object({ firstName: z.string(), lastName: z.string(), phone: z.string() }).nullable(),
  }),
  buyer: z.object({ id: z.number(), firstName: z.string(), lastName: z.string() }),
});

export type QueuedInspection = z.infer<typeof queuedInspectionSchema>;

const queueSchema = z.object({ inspections: z.array(queuedInspectionSchema) });

// The signed-in mechanic's inspection requests, newest first.
export const getQueue = async (): Promise<QueuedInspection[]> =>
  (await request("/api/inspections", { schema: queueSchema })).inspections;

// The moves a mechanic makes: answer a new request, then start an accepted one.
export type MechanicMove = "accepted" | "rejected" | "in_progress";

export const moveInspection = ({ id, status }: { id: number; status: MechanicMove }) =>
  request(`/api/inspections/${id}`, { method: "PATCH", body: { status }, schema: z.unknown() });
