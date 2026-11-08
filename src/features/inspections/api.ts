import { z } from "zod";
import { request } from "../../lib/api/client";
import { locales } from "../../lib/locale";
import type { Locale } from "../../lib/locale";

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

// Without a report language, the API uses the interface's.
export const requestInspection = (input: { carId: number; mechanicId: number; reportLanguage?: Locale }) =>
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

export const itemStatuses = ["pass", "attention", "fail"] as const;

export type ItemStatus = (typeof itemStatuses)[number];

export const inspectionCategories = [
  "exterior",
  "interior",
  "mechanical",
  "electrical",
  "under_vehicle",
  "road_test",
] as const;

export type InspectionCategory = (typeof inspectionCategories)[number];

export const mileageConsistencies = ["consistent", "suspicious", "unverifiable"] as const;

export type MileageConsistency = (typeof mileageConsistencies)[number];

export { verdicts };

export type Verdict = (typeof verdicts)[number];

// The mechanic's unfinished report, as the API keeps it. Every field may be missing.
const reportDraftSchema = z.object({
  matricule: z.string().optional(),
  vin: z.string().optional(),
  carteGriseNumber: z.string().optional(),
  mileage: z.number().optional(),
  mileageConsistency: z.enum(mileageConsistencies).optional(),
  mileageConsistencyNote: z.string().optional(),
  firstRegistrationDate: z.string().optional(),
  inspectedAt: z.string().optional(),
  controleTechniqueValid: z.boolean().optional(),
  controleTechniqueExpiry: z.string().optional(),
  vignetteValid: z.boolean().optional(),
  verdict: z.enum(verdicts).optional(),
  overallScore: z.number().optional(),
  summary: z.string().optional(),
  estimatedRepairCost: z.number().optional(),
  sections: z
    .array(
      z.object({
        category: z.enum(inspectionCategories),
        items: z.array(
          z.object({ label: z.string(), status: z.enum(itemStatuses).nullable(), note: z.string().optional() }),
        ),
      }),
    )
    .optional(),
});

export type ReportDraft = z.infer<typeof reportDraftSchema>;

const inspectionSchema = z.object({
  id: z.number(),
  status: z.enum(inspectionStatuses),
  car: z.object({
    year: z.number(),
    make: nameSchema,
    model: nameSchema,
    listing: z.object({ id: z.number(), title: z.string() }).nullable(),
    photoUrl: z.string().nullable(),
  }),
  buyer: z.object({ firstName: z.string(), lastName: z.string() }),
  // The language the buyer chose for the report.
  reportLanguage: z.enum(locales),
  // Only the assigned mechanic gets these. A draft that no longer reads is dropped.
  reportDraft: reportDraftSchema.nullable().optional().catch(null),
  reportDraftSavedAt: z.string().nullable().optional(),
});

export type Inspection = z.infer<typeof inspectionSchema>;

export const getInspection = async (id: number): Promise<Inspection> =>
  (await request(`/api/inspections/${id}`, { schema: z.object({ inspection: inspectionSchema }) })).inspection;

const savedDraftSchema = z.object({ reportDraftSavedAt: z.string() });

// Replaces the saved draft. Returns when it was saved.
export const saveReportDraft = async ({ id, draft }: { id: number; draft: ReportDraft }): Promise<string> =>
  (await request(`/api/inspections/${id}/draft`, { method: "PUT", body: draft, schema: savedDraftSchema }))
    .reportDraftSavedAt;

// The finished report, as the API requires it.
export type Report = {
  matricule: string;
  vin?: string;
  carteGriseNumber?: string;
  mileage: number;
  mileageConsistency: MileageConsistency;
  mileageConsistencyNote?: string;
  firstRegistrationDate?: string;
  inspectedAt?: string;
  controleTechniqueValid: boolean;
  controleTechniqueExpiry?: string;
  vignetteValid: boolean;
  verdict: Verdict;
  overallScore: number;
  summary: string;
  estimatedRepairCost?: number;
  sections: { category: InspectionCategory; items: { label: string; status: ItemStatus; note?: string }[] }[];
};

// Submits the report. The API then creates the PDF and emails it to the buyer.
export const submitReport = ({ id, report }: { id: number; report: Report }) =>
  request(`/api/inspections/${id}/report`, { method: "POST", body: report, schema: z.unknown() });
