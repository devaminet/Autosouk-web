import { useTranslation } from "react-i18next";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { LanguageMenu } from "../../../components/LanguageMenu";
import { Logo } from "../../../components/Logo";
import { PageTitle } from "../../../components/PageTitle";
import { paths } from "../../../lib/paths";
import { useLogout, useSession } from "../../auth/hooks";

// A placeholder until the marketplace screens exist, so that auth has a
// destination and the session can be seen and ended.
export function HomePage() {
  const { t } = useTranslation();
  const { user, isPending } = useSession();
  const logout = useLogout();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex flex-wrap items-center justify-between gap-16 px-20 py-24 md:px-48">
        <Logo />
        <div className="flex items-center gap-8">
          <LanguageMenu />
          {user && (
            <Button
              isPending={logout.isPending}
              onClick={() => logout.mutate()}
              variant="danger"
            >
              {t("home.logOut")}
            </Button>
          )}
          {!user && !isPending && (
            <>
              <ButtonLink to={paths.login} variant="ghost">
                {t("home.logIn")}
              </ButtonLink>
              <ButtonLink to={paths.register} variant="dark">
                {t("home.signUp")}
              </ButtonLink>
            </>
          )}
        </div>
      </header>
      <main
        className="flex flex-1 flex-col items-center justify-center gap-8 px-20 pb-64 text-center outline-none"
        tabIndex={-1}
      >
        <PageTitle>{t("home.pageTitle")}</PageTitle>
        <h1 className="type-h1 text-ink">
          {user ? t("home.welcome", { name: user.firstName }) : t("home.title")}
        </h1>
        <p className="type-body-m text-muted">{t("home.description")}</p>
      </main>
    </div>
  );
}
