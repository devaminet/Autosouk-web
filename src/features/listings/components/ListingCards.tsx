import { Link } from "react-router";
import { listingPath } from "../../../lib/paths";
import type { SellerListing } from "../api";
import { editActionFor, mediaPathFor, rowPathFor } from "../editAction";
import { resumeDraftPath } from "../wizardSteps";
import { ListingActionsMenu } from "./ListingActionsMenu";
import { ListingPrice } from "./ListingPrice";
import { ListingThumb } from "./ListingThumb";
import { RejectionNote } from "./RejectionNote";
import { StatusBadge } from "./StatusBadge";

type ListingCardsProps = {
  listings: SellerListing[];
  editTo: (listing: SellerListing) => string;
  onDelete: (listing: SellerListing) => void;
};

// The layout for small screens. ListingsTable is the one for wide screens.
export function ListingCards({ listings, editTo, onDelete }: ListingCardsProps) {
  const editFor = (listing: SellerListing) => {
    const action = editActionFor(listing.status);
    return action ? { to: editTo(listing), label: action.label } : undefined;
  };

  return (
    <ul className="flex flex-col gap-12 md:hidden">
      {listings.map((listing) => (
        <li
          // The title's link covers the card. The menu comes later and stays above it.
          className="relative flex items-center gap-12 rounded-lg bg-surface p-8 shadow-elevation-1"
          key={listing.id}
        >
          <ListingThumb listing={listing} />
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <p className="type-h5" dir="auto">
              <Link className="rounded-xs text-ink after:absolute after:inset-0 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" to={rowPathFor(listing)}>
                {listing.title}
              </Link>
            </p>
            <ListingPrice car={listing.car} />
            <StatusBadge status={listing.status} />
            {listing.status === "rejected" && listing.rejectionReason && (
              <RejectionNote reason={listing.rejectionReason} />
            )}
          </div>
          <ListingActionsMenu
            continueTo={listing.status === "draft" ? resumeDraftPath(listing) : undefined}
            edit={editFor(listing)}
            viewTo={listing.status === "draft" ? undefined : listingPath(listing.id)}
            mediaTo={listing.status === "draft" ? undefined : (mediaPathFor(listing) ?? undefined)}
            onDelete={() => onDelete(listing)}
            title={listing.title}
          />
        </li>
      ))}
    </ul>
  );
}
