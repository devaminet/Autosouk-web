import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { PageTitle } from "../../../components/PageTitle";
import { useActiveSection } from "../../../hooks/useActiveSection";
import { ChangePasswordSection } from "../components/account/ChangePasswordSection";
import { LanguageSection } from "../components/account/LanguageSection";
import { LogOutSection } from "../components/account/LogOutSection";
import { PersonalInfoSection } from "../components/account/PersonalInfoSection";
import { ProfilePhotoSection } from "../components/account/ProfilePhotoSection";
import { useSession } from "../hooks";

const sections: { id: string; icon: IconName; label: string }[] = [
  { id: "profile", icon: "user", label: "account.nav.profile" },
  { id: "language", icon: "globe", label: "account.nav.language" },
  { id: "security", icon: "lock", label: "account.nav.security" },
  { id: "log-out", icon: "logout", label: "account.nav.logOut" },
];

const sectionIds = sections.map(({ id }) => id);

// The signed-in user's settings. RequireRole makes sure there is a user.
export function AccountPage() {
  const { t } = useTranslation("auth");
  const { user } = useSession();
  const { active, choose } = useActiveSection(sectionIds);

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-24 px-20 py-24 md:gap-32 md:px-80 md:py-48">
      <PageTitle>{t("account.pageTitle")}</PageTitle>
      <header className="flex flex-col gap-4">
        <p className="type-overline text-muted">{t("account.overline")}</p>
        <h1 className="type-h1 text-ink md:type-display-m">{t("account.title")}</h1>
      </header>
      <div className="flex flex-col gap-24 md:flex-row md:items-start md:gap-32">
        <nav
          aria-label={t("account.nav.label")}
          className="hidden w-3xs shrink-0 flex-col gap-4 md:sticky md:top-24 md:flex"
        >
          {sections.map(({ id, icon, label }) => {
            const current = id === active;
            return (
              // ScrollRestoration resets the scroll after a plain hash link,
              // while a router link scrolls to the section.
              <Link
                aria-current={current ? "location" : undefined}
                className={`flex min-h-control-m items-center gap-12 rounded-md px-12 type-label-m focus-visible:outline-2 focus-visible:outline-brand ${current ? "bg-surface text-ink shadow-elevation-1" : "text-ink-2 hover:bg-surface hover:text-ink"}`}
                key={id}
                onClick={() => choose(id)}
                replace
                to={{ hash: id }}
              >
                <Icon className={current ? "text-brand" : "text-muted"} name={icon} size={18} />
                {t(label)}
              </Link>
            );
          })}
        </nav>
        <div className="flex min-w-0 flex-1 flex-col gap-24">
          <div className="flex scroll-mt-24 flex-col gap-24" id="profile">
            <ProfilePhotoSection id="profile-photo" user={user} />
            <PersonalInfoSection id="personal" user={user} />
          </div>
          <LanguageSection id="language" user={user} />
          <ChangePasswordSection id="security" user={user} />
          <LogOutSection id="log-out" />
        </div>
      </div>
    </div>
  );
}
