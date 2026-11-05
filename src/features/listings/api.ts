import { z } from "zod";
import { request } from "../../lib/api/client";

export const listingStatuses = [
  "draft",
  "pending",
  "approved",
  "withdrawn",
  "rejected",
  "sold",
] as const;

export const listingStatusSchema = z.enum(listingStatuses);

export type ListingStatus = z.infer<typeof listingStatusSchema>;

const carSummarySchema = z.object({
  id: z.number(),
  price: z.number(),
  year: z.number(),
  distance: z.string(),
  carMedias: z.array(
    z.object({
      id: z.number(),
      type: z.enum(["image", "video"]),
      link: z.string(),
      isPrimary: z.boolean(),
    }),
  ),
});

const sellerListingSchema = z.object({
  id: z.number(),
  title: z.string(),
  status: listingStatusSchema,
  rejectionReason: z.string().nullable(),
  updatedAt: z.string(),
  car: carSummarySchema.nullable(),
  completedInspectionsCount: z.number(),
});

export type SellerListing = z.infer<typeof sellerListingSchema>;

const myListingsSchema = z.object({
  listings: z.array(sellerListingSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
    statusCounts: z.record(listingStatusSchema, z.number()),
  }),
});

export type MyListings = z.infer<typeof myListingsSchema>;

export type MyListingsFilter = {
  status?: ListingStatus;
  page: number;
};

export const getMyListings = ({ status, page }: MyListingsFilter) => {
  const query = new URLSearchParams({ page: String(page) });
  if (status) {
    query.set("status", status);
  }
  return request(`/api/listings/mine?${query}`, { schema: myListingsSchema });
};

const createdListingSchema = z.object({
  listing: z.object({ id: z.number() }),
});

export type NewListingInput = {
  title: string;
  description: string;
};

export const createListing = (input: NewListingInput) =>
  request("/api/listings", {
    method: "POST",
    body: input,
    schema: createdListingSchema,
  });

const lookupSchema = z.object({ id: z.number(), slug: z.string() });

const lookupsSchema = z.object({
  cities: z.array(lookupSchema.extend({ name: z.string() })),
  carburants: z.array(lookupSchema),
  states: z.array(lookupSchema),
  origins: z.array(lookupSchema),
});

export type Lookups = z.infer<typeof lookupsSchema>;

export const getLookups = () => request("/api/lookups", { schema: lookupsSchema });

const namedSchema = z.object({ id: z.number(), name: z.string() });

export type Named = z.infer<typeof namedSchema>;

export const getMakes = async () =>
  (await request("/api/makes", { schema: z.object({ makes: z.array(namedSchema) }) })).makes;

export const getModels = async (makeId: number) =>
  (
    await request(`/api/models/${makeId}`, {
      schema: z.object({ models: z.array(namedSchema) }),
    })
  ).models;

const equipmentCategorySchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  equipment: z.array(z.object({ id: z.number(), slug: z.string(), name: z.string() })),
});

export type EquipmentCategory = z.infer<typeof equipmentCategorySchema>;

export const getEquipment = async () =>
  (
    await request("/api/equipment", {
      schema: z.object({ categories: z.array(equipmentCategorySchema) }),
    })
  ).categories;

export const transmissions = ["manual", "automatic"] as const;

export type Transmission = (typeof transmissions)[number];

// The ids let the form show the saved choices again.
const listingCarSchema = z.object({
  id: z.number(),
  makeId: z.number(),
  modelId: z.number(),
  cityId: z.number(),
  carburantId: z.number(),
  originId: z.number(),
  stateId: z.number(),
  price: z.number(),
  year: z.number(),
  distance: z.string(),
  doorsNumber: z.number(),
  fiscalPower: z.number(),
  transmission: z.enum(transmissions),
  ownersCount: z.number(),
  equipment: z.array(z.object({ id: z.number() })),
});

export type ListingCar = z.infer<typeof listingCarSchema>;

const listingDetailSchema = z.object({
  listing: z.object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
    status: listingStatusSchema,
    car: listingCarSchema.nullable(),
  }),
});

export type ListingDetail = z.infer<typeof listingDetailSchema>["listing"];

export const getListing = async (id: number) =>
  (await request(`/api/listings/${id}`, { schema: listingDetailSchema })).listing;

// Empty inputs are left out, so the API names each missing field.
export type CarInput = {
  makeId?: number;
  modelId?: number;
  carburantId?: number;
  originId?: number;
  stateId?: number;
  price?: number;
  year?: number;
  ownersCount?: number;
  cityId?: number;
  distance?: string;
  transmission?: Transmission;
  fiscalPower?: number;
  doorsNumber?: number;
  equipmentIds: number[];
};

export const attachCar = ({ id, car }: { id: number; car: CarInput }) =>
  request(`/api/listings/${id}/car`, { method: "POST", body: car, schema: z.unknown() });

export type ListingChanges = {
  title?: string;
  description?: string;
  car?: CarInput;
};

export const updateListing = ({ id, changes }: { id: number; changes: ListingChanges }) =>
  request(`/api/listings/${id}`, { method: "PATCH", body: changes, schema: z.unknown() });

const deletedListingSchema = z.object({
  deleted: z.literal(true),
  listingId: z.number(),
});

export const deleteListing = (id: number) =>
  request(`/api/listings/${id}`, {
    method: "DELETE",
    schema: deletedListingSchema,
  });
