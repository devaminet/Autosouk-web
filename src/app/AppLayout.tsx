import { Outlet } from "react-router";
import { useSession } from "../features/auth/hooks";
import { AppHeader } from "./AppHeader";
import { MobileTabBar } from "./MobileTabBar";

// The header and navigation around every page outside the auth screens.
export function AppLayout() {
  const { user } = useSession();

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col outline-none" tabIndex={-1}>
        <Outlet />
      </main>
      {user?.role === "seller" && <MobileTabBar />}
    </div>
  );
}
