import { Icon } from "../../../components/Icon";
import type { SellerListing } from "../api";

type ListingThumbProps = {
  listing: SellerListing;
};

// The API lists the primary media first, and a video can't be a thumbnail.
export function ListingThumb({ listing }: ListingThumbProps) {
  const image = listing.car?.carMedias.find(({ type }) => type === "image");

  return image ? (
    <img
      alt=""
      className="h-64 w-96 shrink-0 rounded-md object-cover"
      loading="lazy"
      src={image.link}
    />
  ) : (
    <span className="flex h-64 w-96 shrink-0 items-center justify-center rounded-md bg-paper text-muted">
      <Icon name="car" size={24} />
    </span>
  );
}
