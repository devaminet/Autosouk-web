import type { ButtonVariant } from "../../components/buttonStyles";
import { listingMediaPath } from "../../lib/paths";
import type { ListingStatus } from "./api";
import { resumeDraftPath } from "./wizardSteps";

export type EditAction = {
  label: "edit" | "editResubmit";
  variant: ButtonVariant;
};

// How the edit button looks per status. Any saved edit sends the listing to
// review, which a rejected or withdrawn listing needs to come back. Drafts
// continue in the wizard, and a sold car stays as it was sold.
const actions: Record<ListingStatus, EditAction | null> = {
  draft: null,
  pending: { label: "edit", variant: "secondary" },
  approved: { label: "edit", variant: "secondary" },
  rejected: { label: "editResubmit", variant: "dark" },
  withdrawn: { label: "editResubmit", variant: "secondary" },
  sold: null,
};

export const editActionFor = (status: ListingStatus): EditAction | null => actions[status];

// Where to manage a listing's photos and videos. A draft does it in the wizard.
export const mediaPathFor = (listing: { id: number; status: ListingStatus; car: unknown }): string | null => {
  if (listing.status === "draft") {
    return resumeDraftPath(listing);
  }
  return listing.status === "sold" ? null : listingMediaPath(listing.id);
};
