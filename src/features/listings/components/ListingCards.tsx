import { draftStepPath } from "../../../lib/paths";
import type { SellerListing } from "../api";
import { ListingActionsMenu } from "./ListingActionsMenu";
import { ListingPrice } from "./ListingPrice";
import { ListingThumb } from "./ListingThumb";
import { RejectionNote } from "./RejectionNote";
import { StatusBadge } from "./StatusBadge";

type ListingCardsProps = {
  listings: SellerListing[];
  onDelete: (listing: SellerListing) => void;
};

// The layout for small screens. ListingsTable is the one for wide screens.
export function ListingCards({ listings, onDelete }: ListingCardsProps) {
  return (
    <ul className="flex flex-col gap-12 md:hidden">
      {listings.map((listing) => (
        <li
          className="flex items-center gap-12 rounded-lg bg-surface p-8 shadow-elevation-1"
          key={listing.id}
        >
          <ListingThumb listing={listing} />
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <p className="type-h5 text-ink" dir="auto">
              {listing.title}
            </p>
            <ListingPrice car={listing.car} />
            <StatusBadge status={listing.status} />
            {listing.status === "rejected" && listing.rejectionReason && (
              <RejectionNote reason={listing.rejectionReason} />
            )}
          </div>
          <ListingActionsMenu
            continueTo={listing.status === "draft" ? draftStepPath(listing.id, "car") : undefined}
            onDelete={() => onDelete(listing)}
            title={listing.title}
          />
        </li>
      ))}
    </ul>
  );
}
