import { Outlet } from "react-router";
import { useSession } from "../features/auth/hooks";
import { AppHeader } from "./AppHeader";
import { MobileTabBar } from "./MobileTabBar";

type AppLayoutProps = {
  focusedOnMobile?: boolean;
};

// The header and navigation around every page outside the auth screens.
export function AppLayout({ focusedOnMobile = false }: AppLayoutProps) {
  const { user } = useSession();

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader hideOnMobile={focusedOnMobile} />
      <main className="flex flex-1 flex-col outline-none" tabIndex={-1}>
        <Outlet />
      </main>
      {user && user.role !== "admin" && !focusedOnMobile && <MobileTabBar role={user.role} />}
    </div>
  );
}
