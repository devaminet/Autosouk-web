import { useTranslation } from "react-i18next";
import { Link, NavLink } from "react-router";
import { ButtonLink } from "../components/ButtonLink";
import { LanguageMenu } from "../components/LanguageMenu";
import { Logo } from "../components/Logo";
import { useSession } from "../features/auth/hooks";
import { paths } from "../lib/paths";
import { UserMenu } from "./UserMenu";

type HeaderLinkProps = {
  to: string;
  children: string;
};

function HeaderLink({ to, children }: HeaderLinkProps) {
  return (
    <NavLink
      className={({ isActive }) =>
        `flex min-h-control-m flex-col items-center justify-center gap-4 rounded-xs type-label-m focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${isActive ? "text-ink" : "text-muted hover:text-ink"}`
      }
      end={to === paths.home}
      to={to}
    >
      {({ isActive }) => (
        <>
          {children}
          <span
            aria-hidden="true"
            className={`size-4 rounded-full ${isActive ? "bg-brand" : ""}`}
          />
        </>
      )}
    </NavLink>
  );
}

type AppHeaderProps = {
  hideOnMobile?: boolean;
};

export function AppHeader({ hideOnMobile = false }: AppHeaderProps) {
  const { t } = useTranslation();
  const { user, isPending } = useSession();

  return (
    <header
      className={`flex-wrap items-center justify-between gap-16 border-b border-line px-20 py-12 md:px-48 ${hideOnMobile ? "hidden md:flex" : "flex"}`}
    >
      <div className="flex items-center gap-40">
        <Link
          className="rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          to={paths.home}
        >
          <Logo />
        </Link>
        <nav aria-label={t("nav.main")} className="hidden items-center gap-32 md:flex">
          <HeaderLink to={paths.home}>{t("nav.explore")}</HeaderLink>
          {user?.role === "seller" && (
            <HeaderLink to={paths.myListings}>{t("nav.sell")}</HeaderLink>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-8">
        <LanguageMenu />
        {user && <UserMenu user={user} />}
        {!user && !isPending && (
          <>
            <ButtonLink to={paths.login} variant="ghost">
              {t("nav.logIn")}
            </ButtonLink>
            <ButtonLink to={paths.register} variant="dark">
              {t("nav.signUp")}
            </ButtonLink>
          </>
        )}
      </div>
    </header>
  );
}
