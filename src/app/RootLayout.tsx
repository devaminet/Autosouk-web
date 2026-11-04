import { useEffect, useRef } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router";

export function RootLayout() {
  const { pathname } = useLocation();
  const previous = useRef(pathname);

  // Screen readers stay on the old page after client navigation, so move focus.
  useEffect(() => {
    if (previous.current !== pathname) {
      previous.current = pathname;
      document.querySelector("main")?.focus();
    }
  }, [pathname]);

  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}
