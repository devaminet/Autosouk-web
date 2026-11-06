import { useTranslation } from "react-i18next";
import { PageTitle } from "../../../components/PageTitle";
import { useSession } from "../../auth/hooks";

// A placeholder until the marketplace screens exist, so that auth has a
// destination.
export function HomePage() {
  const { t } = useTranslation();
  const { user } = useSession();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-20 py-64 text-center">
      <PageTitle>{t("home.pageTitle")}</PageTitle>
      <h1 className="type-h1 text-ink">
        {user ? t("home.welcome", { name: user.firstName }) : t("home.title")}
      </h1>
      <p className="type-body-m text-muted">{t("home.description")}</p>
    </div>
  );
}
