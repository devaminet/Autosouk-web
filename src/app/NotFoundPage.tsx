import { useTranslation } from "react-i18next";
import { ButtonLink } from "../components/ButtonLink";
import { PageTitle } from "../components/PageTitle";
import { paths } from "../lib/paths";

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-16 p-24 text-center outline-none"
      tabIndex={-1}
    >
      <PageTitle>{t("notFound.title")}</PageTitle>
      <h1 className="type-h1 text-ink">{t("notFound.title")}</h1>
      <p className="type-body-m text-muted">{t("notFound.description")}</p>
      <ButtonLink to={paths.home} variant="primary">
        {t("notFound.home")}
      </ButtonLink>
    </main>
  );
}
