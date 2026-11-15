import { useEffect, useRef } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router";
import { useSessionEvents } from "../features/auth/hooks";

export function RootLayout() {
  const { pathname } = useLocation();
  const previous = useRef(pathname);
  useSessionEvents();

  // Screen readers stay on the old page after client navigation, so move focus,
  // unless the new page has already put it somewhere more useful.
  useEffect(() => {
    if (previous.current !== pathname) {
      previous.current = pathname;
      const main = document.querySelector("main");
      if (!main?.contains(document.activeElement)) {
        main?.focus();
      }
    }
  }, [pathname]);

  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}
