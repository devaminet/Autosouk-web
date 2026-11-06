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

// Uploaded media only, the primary first.
const carMediaSchema = z.object({
  id: z.number(),
  type: z.enum(["image", "video"]),
  link: z.string(),
  isPrimary: z.boolean(),
});

export type CarMedia = z.infer<typeof carMediaSchema>;

const carSummarySchema = z.object({
  id: z.number(),
  price: z.number(),
  year: z.number(),
  distance: z.string(),
  carMedias: z.array(carMediaSchema),
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
  make: z.object({ name: z.string() }),
  model: z.object({ name: z.string() }),
  city: z.object({ name: z.string(), slug: z.string() }),
  // In catalog display order.
  equipment: z.array(
    z.object({
      id: z.number(),
      slug: z.string(),
      name: z.string(),
      category: z.object({ slug: z.string(), name: z.string() }),
    }),
  ),
  carMedias: z.array(carMediaSchema),
});

export type ListingCar = z.infer<typeof listingCarSchema>;

const listingDetailSchema = z.object({
  listing: z.object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
    status: listingStatusSchema,
    car: listingCarSchema.nullable(),
    // The seller, as buyers see them.
    user: z
      .object({
        firstName: z.string(),
        lastName: z.string(),
        isVerified: z.boolean().nullable(),
        city: z.object({ name: z.string(), slug: z.string() }).nullable(),
      })
      .nullish(),
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

// A field left out keeps its value. Null clears a number, which the API refuses
// by name, so an emptied input gets its own error message.
export type CarChanges = {
  [Field in keyof CarInput]?: CarInput[Field] | null;
};

export type ListingChanges = {
  title?: string;
  description?: string;
  car?: CarChanges;
};

export const updateListing = ({ id, changes }: { id: number; changes: ListingChanges }) =>
  request(`/api/listings/${id}`, { method: "PATCH", body: changes, schema: z.unknown() });

const presignedPostSchema = z.object({
  url: z.string(),
  fields: z.record(z.string(), z.string()),
});

const addedMediaSchema = z.object({
  carMedia: z.array(
    z.object({ id: z.number(), filename: z.string(), originalName: z.string(), upload: presignedPostSchema }),
  ),
});

// Reserves storage for each file. Names must be unique within one request.
export const addMedia = async ({ id, names }: { id: number; names: string[] }) =>
  (
    await request(`/api/listings/${id}/media`, {
      method: "POST",
      body: { files: names.map((name) => ({ name })) },
      schema: addedMediaSchema,
    })
  ).carMedia;

const confirmedMediaSchema = z.object({
  uploaded: z.array(z.string()),
  rejected: z.array(z.string()),
  pending: z.array(z.object({ id: z.number(), filename: z.string() })),
});

export type ConfirmedMedia = z.infer<typeof confirmedMediaSchema>;

// Makes uploaded files visible, and removes those of the wrong type or size.
export const confirmMedia = (id: number) =>
  request(`/api/listings/${id}/media/confirm`, { method: "POST", schema: confirmedMediaSchema });

export const deleteMedia = ({ id, mediaIds }: { id: number; mediaIds: number[] }) =>
  request(`/api/listings/${id}/media`, {
    method: "DELETE",
    body: { mediaIds },
    schema: z.object({ deleted: z.array(z.number()) }),
  });

export const setCover = ({ id, mediaId }: { id: number; mediaId: number }) =>
  request(`/api/listings/${id}/media/${mediaId}/primary`, {
    method: "PATCH",
    schema: z.object({ carMedias: z.array(carMediaSchema) }),
  });

export const submitListing = (id: number) =>
  request(`/api/listings/${id}/submit`, {
    method: "POST",
    schema: z.object({ listing: z.object({ id: z.number(), status: listingStatusSchema }) }),
  });

const deletedListingSchema = z.object({
  deleted: z.literal(true),
  listingId: z.number(),
});

export const deleteListing = (id: number) =>
  request(`/api/listings/${id}`, {
    method: "DELETE",
    schema: deletedListingSchema,
  });

export const listingSorts = ["newest", "oldest", "price_asc", "price_desc"] as const;

export type ListingSort = (typeof listingSorts)[number];

export type PublicListingsFilter = {
  page?: number;
  limit?: number;
  makeId?: number;
  modelId?: number;
  cityId?: number;
  minPrice?: number;
  maxPrice?: number;
  // Cars must have every item.
  equipmentIds?: number[];
  transmission?: Transmission;
  // Cars with any of these fuels.
  carburantIds?: number[];
  sort?: ListingSort;
};

// What GET /api/listings returns for each approved listing: what its card shows.
const publicListingSchema = z.object({
  id: z.number(),
  title: z.string(),
  createdAt: z.string(),
  car: z
    .object({
      price: z.number(),
      year: z.number(),
      distance: z.string(),
      transmission: z.enum(transmissions),
      // The fuel's slug, in a field of the same name.
      carburant: z.object({ carburant: z.string() }).nullable(),
      carMedias: z.array(carMediaSchema.omit({ id: true })),
      city: z.object({ name: z.string(), slug: z.string() }).nullable(),
    })
    .nullable(),
  // The 0-100 score of the car's latest completed inspection.
  inspectionScore: z.number().nullable(),
});

export type PublicListing = z.infer<typeof publicListingSchema>;

const publicListingsSchema = z.object({
  listings: z.array(publicListingSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
});

export type PublicListings = z.infer<typeof publicListingsSchema>;

// Approved listings only. The API never needs the visitor's token for them.
export const getPublicListings = (filter: PublicListingsFilter) => {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(filter)) {
    if (value !== undefined) {
      query.set(name, Array.isArray(value) ? value.join(",") : String(value));
    }
  }
  return request(`/api/listings?${query}`, { schema: publicListingsSchema, anonymous: true });
};
