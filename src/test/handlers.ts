import { http, HttpResponse } from "msw";
import arAuth from "../../public/locales/ar/auth.json";
import arCommon from "../../public/locales/ar/common.json";
import arListings from "../../public/locales/ar/listings.json";
import enAuth from "../../public/locales/en/auth.json";
import enCommon from "../../public/locales/en/common.json";
import enListings from "../../public/locales/en/listings.json";
import frAuth from "../../public/locales/fr/auth.json";
import frCommon from "../../public/locales/fr/common.json";
import frListings from "../../public/locales/fr/listings.json";

const translations: Record<string, unknown> = {
  "en/common": enCommon,
  "en/auth": enAuth,
  "en/listings": enListings,
  "fr/common": frCommon,
  "fr/auth": frAuth,
  "fr/listings": frListings,
  "ar/common": arCommon,
  "ar/auth": arAuth,
  "ar/listings": arListings,
};

const apiCatalogs: Record<string, unknown> = {
  enums: {
    role: { buyer: "Buyer", seller: "Seller", mechanic: "Mechanic" },
    city: { casablanca: "Casablanca", agadir: "Agadir" },
    listing_status: {
      draft: "Draft",
      pending: "Pending review",
      approved: "Approved",
      withdrawn: "Withdrawn",
      rejected: "Rejected",
      sold: "Sold",
    },
  },
  errors: { unexpected: "An unexpected error occurred" },
  messages: {},
};

export const testUser = {
  id: 1,
  firstName: "Amine",
  lastName: "Takha",
  email: "amine@autosouk.ma",
  cityId: 1,
  imageUrl: null,
  isVerified: true,
  phone: "+212612345678",
  locale: "en",
  role: "buyer",
};

export const apiErrors = (
  status: number,
  ...errors: { code: string; message: string; field?: string }[]
) => HttpResponse.json({ errors }, { status });

export const defaultHandlers = [
  http.get("*/locales/:lng/:ns.json", ({ params }) =>
    HttpResponse.json(
      translations[`${String(params.lng)}/${String(params.ns)}`] ?? {},
    ),
  ),
  http.get("*/api/i18n/:lng/:ns", ({ params }) =>
    HttpResponse.json(apiCatalogs[String(params.ns)] ?? {}),
  ),
  http.get("*/api/lookups", () =>
    HttpResponse.json({
      cities: [
        { id: 1, slug: "casablanca", name: "Casablanca" },
        { id: 2, slug: "agadir", name: "Agadir" },
      ],
    }),
  ),
  http.get("*/api/listings/mine", () =>
    HttpResponse.json({
      listings: [],
      meta: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        statusCounts: {
          draft: 0,
          pending: 0,
          approved: 0,
          withdrawn: 0,
          rejected: 0,
          sold: 0,
        },
      },
    }),
  ),
  // No session by default: the API answers 400 when the cookie is missing.
  http.post("*/api/auth/refresh-token", () =>
    apiErrors(400, {
      code: "validation.required",
      message: "Required",
      field: "refreshToken",
    }),
  ),
];
