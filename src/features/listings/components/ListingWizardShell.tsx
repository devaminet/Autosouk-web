import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { paths } from "../../../lib/paths";
import type { WizardStep } from "../wizardSteps";
import { WizardStepper } from "./WizardStepper";

type ListingWizardShellProps = {
  step: WizardStep;
  children: ReactNode;
};

// What every step of creating a listing shares: the way out and the progress.
export function ListingWizardShell({ step, children }: ListingWizardShellProps) {
  const { t } = useTranslation("listings");

  return (
    <div className="flex flex-1 flex-col gap-24 pt-16 md:px-80 md:py-32">
      <div className="relative flex min-h-40 items-center justify-center px-20 md:hidden">
        <Link
          aria-label={t("wizard.back")}
          className="absolute inset-s-20 flex size-40 items-center justify-center rounded-full border border-line bg-surface text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          to={paths.myListings}
        >
          <Icon name="arrow-left" size={18} />
        </Link>
        <p className="type-h5 text-ink">{t("wizard.title")}</p>
      </div>

      <div className="hidden items-center justify-between gap-16 md:flex">
        <nav aria-label={t("wizard.breadcrumb")}>
          <ol className="flex items-center gap-8 type-label-m">
            <li>
              <Link
                className="flex items-center gap-8 rounded-xs text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                to={paths.myListings}
              >
                <Icon name="arrow-left" size={16} />
                {t("myListings.title")}
              </Link>
            </li>
            <li aria-hidden="true" className="text-muted">
              /
            </li>
            <li aria-current="page" className="text-muted">
              {t("wizard.title")}
            </li>
          </ol>
        </nav>
        <ButtonLink to={paths.myListings}>
          <Icon name="x" size={16} />
          {t("wizard.discard")}
        </ButtonLink>
      </div>

      <div className="px-20 md:px-0">
        <WizardStepper step={step} />
      </div>

      {children}
    </div>
  );
}
