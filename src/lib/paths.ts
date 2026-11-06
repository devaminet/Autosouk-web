export const paths = {
  home: "/",
  login: "/login",
  register: "/register",
  checkEmail: "/check-email",
  // The API redirects to these two pages from links in its emails.
  verifyEmail: "/verify-email",
  resetPassword: "/reset-password",
  forgotPassword: "/forgot-password",
  // A listing as buyers see it. Build links with listingPath.
  listing: "/listings/:listingId",
  myListings: "/my-listings",
  newListing: "/my-listings/new",
  // Route patterns. Build links to them with draftStepPath.
  draftListing: "/my-listings/:listingId/listing",
  draftCar: "/my-listings/:listingId/car",
  draftPhotos: "/my-listings/:listingId/photos",
  draftReview: "/my-listings/:listingId/review",
  // The photos and videos of a published listing. Build links with listingMediaPath.
  listingMedia: "/my-listings/:listingId/media",
} as const;

export type DraftStep = "listing" | "car" | "photos" | "review";

export const draftStepPath = (listingId: number, step: DraftStep): string =>
  `/my-listings/${listingId}/${step}`;

export const listingMediaPath = (listingId: number): string => `/my-listings/${listingId}/media`;

export const listingPath = (listingId: number): string => `/listings/${listingId}`;
