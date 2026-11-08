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

type MobileTabBarProps = {
  role: "buyer" | "seller" | "mechanic";
};

// The navigation of buyers, sellers and mechanics on small screens.
export function MobileTabBar({ role }: MobileTabBarProps) {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("nav.main")}
      className="sticky bottom-0 z-10 flex border-t border-line bg-surface md:hidden"
    >
      <Tab icon="home" to={paths.home}>
        {t("nav.exploreShort")}
      </Tab>
      {role === "seller" && (
        <Tab icon="car" to={paths.myListings}>
          {t("nav.myListings")}
        </Tab>
      )}
      {role === "buyer" && (
        <Tab icon="heart" to={paths.saved}>
          {t("nav.savedShort")}
        </Tab>
      )}
      <Tab icon="award" to={paths.mechanics}>
        {t("nav.mechanicsShort")}
      </Tab>
      {role === "mechanic" && (
        <Tab icon="inbox" to={paths.inspections}>
          {t("nav.queue")}
        </Tab>
      )}
      {role === "mechanic" && (
        <Tab icon="wrench" to={paths.workshop}>
          {t("nav.workshopShort")}
        </Tab>
      )}
      <Tab icon="user" to={paths.account}>
        {t("nav.account")}
      </Tab>
    </nav>
  );
}
