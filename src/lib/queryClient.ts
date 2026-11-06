import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api/client";

// A missing resource stays missing, so asking again only delays the message.
// Anything else, such as a network failure, gets one more try.
export const shouldRetry = (failureCount: number, error: unknown): boolean =>
  failureCount < 1 && !(error instanceof ApiError && error.status === 404);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
  },
});
