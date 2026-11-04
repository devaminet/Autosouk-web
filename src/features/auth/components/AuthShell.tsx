import type { ReactNode } from "react";
import { Link } from "react-router";
import { LanguageMenu } from "../../../components/LanguageMenu";
import { Logo } from "../../../components/Logo";
import { paths } from "../../../lib/paths";

type AuthShellProps = {
  // Shown next to the language switch, such as "New here? Create account".
  action?: ReactNode;
  // For a page with its own mobile brand band.
  hideHeaderOnMobile?: boolean;
  children: ReactNode;
};

export function AuthShell({
  action,
  hideHeaderOnMobile = false,
  children,
}: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header
        className={`items-center justify-between gap-16 px-20 py-24 md:px-48 ${hideHeaderOnMobile ? "hidden md:flex" : "flex"}`}
      >
        <Link
          className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          to={paths.home}
        >
          <Logo />
        </Link>
        <div className="flex items-center gap-8">
          {action}
          <LanguageMenu />
        </div>
      </header>
      <main
        className="flex flex-1 items-start justify-center px-20 pb-64 pt-24 outline-none md:items-center"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}
