import { useTranslation } from "react-i18next";
import { Link, NavLink, useMatch } from "react-router";
import { ButtonLink } from "../components/ButtonLink";
import { Icon } from "../components/Icon";
import { LanguageMenu } from "../components/LanguageMenu";
import { Logo } from "../components/Logo";
import { useSession } from "../features/auth/hooks";
import { paths } from "../lib/paths";
import { UserMenu } from "./UserMenu";

type HeaderLinkProps = {
  to: string;
  // Another page that belongs to this link, such as search results under Explore.
  alsoActiveOn?: string;
  children: string;
};

function HeaderLink({ to, alsoActiveOn, children }: HeaderLinkProps) {
  const otherMatch = useMatch(alsoActiveOn ?? to);
  const onOther = alsoActiveOn !== undefined && otherMatch !== null;
  return (
    <NavLink
      className={({ isActive: isOwn }) => {
        const isActive = isOwn || onOther;
        return `flex min-h-control-m flex-col items-center justify-center gap-4 rounded-xs type-label-m focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${isActive ? "text-ink" : "text-muted hover:text-ink"}`;
      }}
      end={to === paths.home}
      to={to}
    >
      {({ isActive: isOwn }) => (
        <>
          {children}
          <span
            aria-hidden="true"
            className={`size-4 rounded-full ${isOwn || onOther ? "bg-brand" : ""}`}
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
          <HeaderLink alsoActiveOn={paths.search} to={paths.home}>
            {t("nav.explore")}
          </HeaderLink>
          {user?.role === "seller" && (
            <HeaderLink to={paths.myListings}>{t("nav.sell")}</HeaderLink>
          )}
          {user?.role === "buyer" && <HeaderLink to={paths.saved}>{t("nav.saved")}</HeaderLink>}
          {user?.role === "mechanic" && <HeaderLink to={paths.workshop}>{t("nav.workshop")}</HeaderLink>}
        </nav>
      </div>
      <div className="flex items-center gap-8">
        <LanguageMenu />
        {user?.role === "buyer" && (
          <NavLink
            aria-label={t("nav.saved")}
            className={({ isActive }) =>
              `flex size-40 items-center justify-center rounded-full ring-1 ring-line ring-inset hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${isActive ? "bg-brand-soft text-brand" : "bg-surface text-ink"}`
            }
            to={paths.saved}
          >
            <Icon name="heart" size={18} />
          </NavLink>
        )}
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
