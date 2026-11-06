export const paths = {
  home: "/",
  login: "/login",
  register: "/register",
  checkEmail: "/check-email",
  // The API redirects to these two pages from links in its emails.
  verifyEmail: "/verify-email",
  resetPassword: "/reset-password",
  forgotPassword: "/forgot-password",
  myListings: "/my-listings",
  newListing: "/my-listings/new",
  // Route patterns. Build links to them with draftStepPath.
  draftListing: "/my-listings/:listingId/listing",
  draftCar: "/my-listings/:listingId/car",
  draftPhotos: "/my-listings/:listingId/photos",
  draftReview: "/my-listings/:listingId/review",
} as const;

export type DraftStep = "listing" | "car" | "photos" | "review";

export const draftStepPath = (listingId: number, step: DraftStep): string =>
  `/my-listings/${listingId}/${step}`;
