import type { ButtonVariant } from "../../components/buttonStyles";
import type { ListingStatus } from "./api";

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
