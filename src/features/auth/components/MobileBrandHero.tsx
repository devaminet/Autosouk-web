import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { LanguageMenu } from "../../../components/LanguageMenu";
import { Logo } from "../../../components/Logo";
import { paths } from "../../../lib/paths";

// The login page's brand band on mobile, which replaces the header.
export function MobileBrandHero() {
  const { t } = useTranslation("auth");

  return (
    <div className="relative flex flex-col gap-12 rounded-2xl bg-night p-24 md:hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden rounded-2xl bg-zellige"
      />
      <div className="relative flex items-center justify-between gap-8">
        <Link to={paths.home}>
          <Logo tone="dark" />
        </Link>
        <LanguageMenu tone="dark" />
      </div>
      <p className="relative type-h1 text-surface">
        {t("login.heroLine1")}
        <br />
        {t("login.heroLine2")}
      </p>
    </div>
  );
}
