import { useTranslation } from "react-i18next";
import { PageTitle } from "../components/PageTitle";
import { paths } from "../lib/paths";

// The route error boundary. A full page load resets a broken state.
export function ErrorPage() {
  const { t } = useTranslation();

  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-16 p-24 text-center"
      role="alert"
    >
      <PageTitle>{t("errorPage.title")}</PageTitle>
      <h1 className="type-h1 text-ink">{t("errorPage.title")}</h1>
      <p className="type-body-m text-muted">{t("errorPage.description")}</p>
      <a className="type-label-m text-brand underline" href={paths.home}>
        {t("errorPage.home")}
      </a>
    </main>
  );
}
