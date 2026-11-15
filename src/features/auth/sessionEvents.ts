import { queryClient } from "../../lib/queryClient";
import { refreshSession, sessionKey } from "./session";

// The API's Server-Sent Events stream. It sends `session.revoked` when this
// browser's session ends anywhere: signed out from another device, logged out
// in another tab, or ended everywhere after a stolen token. It sends
// `devices.changed` when a device of the user signs in or out.
const streamPath = "/api/auth/events";

// One tab per browser holds the stream, and tells the others over this channel.
// It saves connections (browsers allow only six per server over HTTP/1.1) and
// keeps tabs from refreshing the shared token at the same time, which the API
// would take for theft.
const lockName = "autosouk.session-events";
const channelName = "autosouk.session";
const endedMessage = "session.ended";
const devicesMessage = "devices.changed";

const minRetryMs = 5 * 1000;
const maxRetryMs = 60 * 1000;

type Stop = () => void;

type StreamHandlers = {
  // Called once, when the session ends.
  onEnded: () => void;
  onDevicesChanged: () => void;
};

// Opens the stream and calls the handlers on its events.
const openStream = ({ onEnded, onDevicesChanged }: StreamHandlers): Stop => {
  let source: EventSource | null = null;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let retryMs = minRetryMs;
  let stopped = false;

  const stop = () => {
    stopped = true;
    clearTimeout(retry);
    source?.close();
    source = null;
  };
  const end = () => {
    if (!stopped) {
      stop();
      onEnded();
    }
  };
  const reconnectLater = () => {
    retry = setTimeout(connect, retryMs);
    retryMs = Math.min(retryMs * 2, maxRetryMs);
  };

  function connect() {
    const current = new EventSource(streamPath);
    source = current;
    current.addEventListener("open", () => {
      retryMs = minRetryMs;
    });
    current.addEventListener("session.revoked", end);
    current.addEventListener("devices.changed", onDevicesChanged);
    current.addEventListener("error", () => {
      // After a dropped connection the browser reconnects by itself. It gives
      // up only when the API refuses the stream, so ask the API whether the
      // session still lives.
      if (stopped || current.readyState !== EventSource.CLOSED) {
        return;
      }
      source = null;
      refreshSession().then(
        (user) => {
          if (stopped) {
            return;
          }
          if (user) {
            queryClient.setQueryData(sessionKey, user);
            reconnectLater();
          } else {
            end();
          }
        },
        () => {
          // The API can't be reached: try again later.
          if (!stopped) {
            reconnectLater();
          }
        },
      );
    });
  }

  connect();
  return stop;
};

// Calls the handlers on the session's events, in this tab and every other tab
// of the browser. Returns the function that stops watching.
export const watchSession = ({ onEnded, onDevicesChanged }: StreamHandlers): Stop => {
  if (typeof EventSource === "undefined") {
    return () => undefined;
  }
  const channel =
    typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(channelName);
  const abort = new AbortController();
  let stopStream: Stop = () => undefined;
  let releaseLock: () => void = () => undefined;
  let stopped = false;

  const stop = () => {
    if (stopped) {
      return;
    }
    stopped = true;
    abort.abort();
    stopStream();
    releaseLock();
    channel?.close();
  };
  const end = () => {
    if (!stopped) {
      stop();
      onEnded();
    }
  };
  // The tab holding the stream tells the others before ending its own session.
  const endEverywhere = () => {
    channel?.postMessage(endedMessage);
    end();
  };
  const devicesChangedEverywhere = () => {
    channel?.postMessage(devicesMessage);
    onDevicesChanged();
  };
  const leader = { onEnded: endEverywhere, onDevicesChanged: devicesChangedEverywhere };

  channel?.addEventListener("message", (event: MessageEvent<unknown>) => {
    if (event.data === endedMessage) {
      end();
    } else if (event.data === devicesMessage && !stopped) {
      onDevicesChanged();
    }
  });

  if ("locks" in navigator) {
    // Waits until no other tab holds the stream, then holds it until stopped.
    navigator.locks
      .request(lockName, { signal: abort.signal }, () => {
        if (stopped) {
          return undefined;
        }
        stopStream = openStream(leader);
        return new Promise<void>((resolve) => {
          releaseLock = resolve;
        });
      })
      // Stopping while waiting for the lock aborts the request.
      .catch(() => undefined);
  } else {
    stopStream = openStream(leader);
  }

  return stop;
};
