import { useTranslation } from "react-i18next";
import { ButtonLink } from "../../../../components/ButtonLink";

type SellerBannerProps = {
  // Where "List your car" leads: the new listing form, or sign up first.
  to: string;
};

export function SellerBanner({ to }: SellerBannerProps) {
  const { t } = useTranslation("listings");

  return (
    <section
      aria-labelledby="sellers-title"
      className="mx-20 flex flex-col gap-24 rounded-2xl bg-saffron p-24 md:mx-48 md:p-48 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="flex max-w-2xl flex-col gap-8">
        <p className="type-overline text-ink-2">{t("explore.sellers.overline")}</p>
        <h2 className="type-h2 text-ink md:type-display-m" id="sellers-title">
          {t("explore.sellers.title")}
        </h2>
        <p className="type-body-l text-ink-2">{t("explore.sellers.description")}</p>
      </div>
      <ButtonLink className="self-start lg:self-auto" size="l" to={to} variant="dark">
        {t("explore.sellers.cta")}
      </ButtonLink>
    </section>
  );
}
