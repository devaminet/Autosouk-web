import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { Icon } from "../components/Icon";
import type { IconName } from "../components/Icon";
import { paths } from "../lib/paths";

type TabProps = {
  to: string;
  icon: IconName;
  children: string;
};

function Tab({ to, icon, children }: TabProps) {
  return (
    <NavLink
      className={({ isActive }) =>
        `flex min-h-control-l flex-1 flex-col items-center justify-center gap-4 py-8 type-label-s focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand ${isActive ? "text-brand" : "text-muted"}`
      }
      end
      to={to}
    >
      <Icon name={icon} size={22} />
      {children}
    </NavLink>
  );
}

// The seller's navigation on small screens.
export function MobileTabBar() {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("nav.main")}
      className="sticky bottom-0 z-10 flex border-t border-line bg-surface md:hidden"
    >
      <Tab icon="home" to={paths.home}>
        {t("nav.exploreShort")}
      </Tab>
      <Tab icon="car" to={paths.myListings}>
        {t("nav.myListings")}
      </Tab>
      <Tab icon="user" to={paths.account}>
        {t("nav.account")}
      </Tab>
    </nav>
  );
}
