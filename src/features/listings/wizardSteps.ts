import { draftStepPath } from "../../lib/paths";

export const wizardSteps = ["listing", "car", "photos", "review"] as const;

export type WizardStep = (typeof wizardSteps)[number];

// Where to continue a draft: media needs a car, so a draft without one starts there.
export const resumeDraftPath = (listing: { id: number; car: unknown }): string =>
  draftStepPath(listing.id, listing.car ? "photos" : "car");
