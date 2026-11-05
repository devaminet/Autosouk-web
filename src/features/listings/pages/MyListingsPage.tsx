import { useTranslation } from "react-i18next";
import { PageTitle } from "../../../components/PageTitle";

export function MyListingsPage() {
  const { t } = useTranslation("listings");

  return (
    <div className="flex flex-col gap-4 px-20 py-24 md:px-80 md:py-48">
      <PageTitle>{t("myListings.title")}</PageTitle>
      <p className="type-overline text-brand">{t("myListings.overline")}</p>
      <h1 className="type-h1 text-ink md:type-display-m">{t("myListings.title")}</h1>
    </div>
  );
}
