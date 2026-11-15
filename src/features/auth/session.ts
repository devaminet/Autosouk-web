import { ApiError, setAccessToken, setUnauthorizedHandler } from "../../lib/api/client";
import { queryClient } from "../../lib/queryClient";
import { logout, postRefreshToken } from "./api";
import type { AuthUser, Session } from "./api";

export const sessionKey = ["session"];

// One person's data must never show for the next person on this browser.
const clearUserData = () => {
  queryClient.removeQueries({
    predicate: ({ queryKey }) => queryKey[0] !== sessionKey[0],
  });
};

// Set while this tab logs out, and after, so the session events its own
// logout causes don't count as a sign-out from elsewhere.
let loggingOut = false;

export const isLoggingOut = () => loggingOut;

export const startSession = ({ accessToken, user }: Session) => {
  loggingOut = false;
  setAccessToken(accessToken);
  clearUserData();
  queryClient.setQueryData(sessionKey, user);
};

export const endSession = () => {
  setAccessToken(null);
  clearUserData();
  queryClient.setQueryData(sessionKey, null);
};

// Set when the API ended the session from elsewhere, so the login page can
// say why. Signing in again clears it with the rest of the user's data.
export const sessionRevokedKey = ["sessionRevoked"];

export const endRevokedSession = () => {
  endSession();
  queryClient.setQueryData(sessionRevokedKey, true);
};

// The login page shows the notice until the user goes elsewhere.
export const clearSessionRevoked = () => {
  if (queryClient.getQueryData(sessionRevokedKey) === true) {
    queryClient.setQueryData(sessionRevokedKey, false);
  }
};

// Changes the signed-in user's details that the session holds, such as the photo.
export const updateSessionUser = (changes: Partial<AuthUser>) => {
  queryClient.setQueryData<AuthUser | null>(sessionKey, (user) =>
    user ? { ...user, ...changes } : user,
  );
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

// Asks the API to end the session. The caller ends it here once this resolves.
export const logOut = async () => {
  loggingOut = true;
  try {
    await logout();
  } catch (error) {
    // The API may have ended the session even though its answer was lost.
    const user = await refreshSession().catch(() => undefined);
    if (user === null) {
      return;
    }
    loggingOut = false;
    if (user) {
      queryClient.setQueryData(sessionKey, user);
    }
    throw error;
  }
};
