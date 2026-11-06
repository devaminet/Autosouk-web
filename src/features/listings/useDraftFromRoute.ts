import { useParams } from "react-router";
import { useListing } from "./hooks";

// The draft named by the route's :listingId. The id is null when it isn't a number.
export const useDraftFromRoute = () => {
  const { listingId = "" } = useParams();
  const id = /^\d+$/u.test(listingId) ? Number(listingId) : null;
  return { id, query: useListing(id) };
};
