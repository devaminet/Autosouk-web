import { setupServer } from "msw/node";
import { defaultHandlers } from "./handlers";

// Imported first by setup.ts: i18n reads the language and fetches translations
// as soon as it loads, so both must be ready before that.
localStorage.setItem("autosouk.locale", "en");

export const server = setupServer(...defaultHandlers);

server.listen({ onUnhandledFrame: "error" });
