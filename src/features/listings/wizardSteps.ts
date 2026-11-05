export const wizardSteps = ["listing", "car", "photos", "review"] as const;

export type WizardStep = (typeof wizardSteps)[number];
