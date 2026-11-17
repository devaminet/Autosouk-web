import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet } from "react-router";
import { Icon } from "../components/Icon";
import type { IconName } from "../components/Icon";
import { LanguageMenu } from "../components/LanguageMenu";
import { Logo } from "../components/Logo";
import { useLogout } from "../features/auth/hooks";
import { paths } from "../lib/paths";

const links: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: paths.adminMechanics, label: "nav.adminMechanics", icon: "wrench" },
  { to: paths.home, label: "nav.marketplace", icon: "home", end: true },
];

// Admin pages: a dark side menu on wide screens, a bar on top on small ones.
export function AdminLayout() {
  const { t } = useTranslation();
  const logout = useLogout();

  return (
    <div className="flex min-h-dvh flex-col bg-paper md:flex-row">
      <aside className="flex flex-col gap-16 bg-night p-20 md:sticky md:top-0 md:h-dvh md:w-filters md:shrink-0 md:gap-32">
        <div className="flex items-center justify-between gap-12">
          <Link
            className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            to={paths.adminMechanics}
          >
            <Logo tone="dark" />
          </Link>
          <LanguageMenu tone="dark" />
        </div>
        <nav aria-label={t("nav.admin")} className="flex gap-4 md:flex-col">
          {links.map((link) => (
            <NavLink
              className={({ isActive }) =>
                `flex min-h-control-m items-center gap-12 rounded-md px-12 type-label-m focus-visible:outline-2 focus-visible:outline-brand ${isActive ? "bg-night-2 text-surface" : "text-subtle hover:text-surface"}`
              }
              end={link.end}
              key={link.to}
              to={link.to}
            >
              <Icon name={link.icon} size={18} />
              {t(link.label)}
            </NavLink>
          ))}
        </nav>
        <button
          aria-busy={logout.isPending}
          className="mt-auto hidden min-h-control-m cursor-pointer items-center gap-12 rounded-md px-12 type-label-m text-subtle hover:text-surface focus-visible:outline-2 focus-visible:outline-brand md:flex"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
          type="button"
        >
          <Icon name="logout" size={18} />
          {t("nav.logOut")}
        </button>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col outline-none" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
