import { useParams } from "react-router";
import { useListing } from "./hooks";

// The listing id in a route's :listingId, or null when it isn't a number.
export const listingIdFrom = ({ listingId = "" }: { listingId?: string }): number | null =>
  /^\d+$/u.test(listingId) ? Number(listingId) : null;

// The draft named by the route's :listingId.
export const useDraftFromRoute = () => {
  const id = listingIdFrom(useParams());
  return { id, query: useListing(id) };
};
