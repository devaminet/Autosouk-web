import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import { wizardSteps } from "../wizardSteps";
import type { WizardStep } from "../wizardSteps";

type WizardStepperProps = {
  step: WizardStep;
};

// A row of named steps on wide screens, and a progress bar on small ones.
export function WizardStepper({ step }: WizardStepperProps) {
  const { t } = useTranslation("listings");
  const current = wizardSteps.indexOf(step);
  const progress = t("wizard.progress", {
    current: current + 1,
    total: wizardSteps.length,
  });

  return (
    <>
      <div className="flex flex-col gap-8 md:hidden">
        <p className="type-overline text-brand">
          {progress} · {t(`wizard.steps.${step}`)}
        </p>
        <div aria-hidden="true" className="flex gap-4">
          {wizardSteps.map((item, index) => (
            <span
              className={`h-4 flex-1 rounded-full ${
                index < current ? "bg-success" : index === current ? "bg-brand" : "bg-line"
              }`}
              key={item}
            />
          ))}
        </div>
      </div>

      <div className="hidden items-center justify-between gap-16 rounded-xl border border-line bg-surface px-24 py-16 md:flex">
        <ol className="flex items-center gap-12">
          {wizardSteps.map((item, index) => (
            <Fragment key={item}>
              {index > 0 && (
                <li
                  aria-hidden="true"
                  className={`h-2 w-40 rounded-full ${index <= current ? "bg-success" : "bg-line-strong"}`}
                />
              )}
              <li
                aria-current={index === current ? "step" : undefined}
                className={`flex items-center gap-8 type-label-m ${index <= current ? "text-ink" : "text-muted"}`}
              >
                <span
                  className={`flex size-control-s items-center justify-center rounded-full type-label-s ${
                    index < current
                      ? "bg-success text-on-brand"
                      : index === current
                        ? "bg-brand text-on-brand"
                        : "bg-surface ring-1 ring-line-strong ring-inset"
                  }`}
                >
                  {index < current ? <Icon name="check" size={16} /> : <bdi dir="ltr">{index + 1}</bdi>}
                </span>
                {t(`wizard.steps.${item}`)}
              </li>
            </Fragment>
          ))}
        </ol>
        <p className="shrink-0 type-mono-s text-muted">{progress}</p>
      </div>
    </>
  );
}
