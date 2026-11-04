import { ApiError, setAccessToken, setUnauthorizedHandler } from "../../lib/api/client";
import { queryClient } from "../../lib/queryClient";
import { postRefreshToken } from "./api";
import type { AuthUser, Session } from "./api";

export const sessionKey = ["session"];

export const startSession = ({ accessToken, user }: Session) => {
  setAccessToken(accessToken);
  queryClient.setQueryData(sessionKey, user);
};

export const endSession = () => {
  setAccessToken(null);
  queryClient.setQueryData(sessionKey, null);
};

let refreshing: Promise<AuthUser | null> | null = null;

// The API rotates refresh tokens and treats a reused one as theft, which ends
// the session. So only one refresh may run at a time, even in StrictMode.
export const refreshSession = (): Promise<AuthUser | null> => {
  refreshing ??= postRefreshToken()
    .then(({ accessToken, user }) => {
      setAccessToken(accessToken);
      return user;
    })
    .catch((error: unknown) => {
      setAccessToken(null);
      // A client error means no valid session. Anything else is a real failure.
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return null;
      }
      throw error;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
};

setUnauthorizedHandler(async () => {
  try {
    const user = await refreshSession();
    queryClient.setQueryData(sessionKey, user);
    return user !== null;
  } catch {
    queryClient.setQueryData(sessionKey, null);
    return false;
  }
});
