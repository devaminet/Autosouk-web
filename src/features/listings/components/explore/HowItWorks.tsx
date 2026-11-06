import { useTranslation } from "react-i18next";
import { Icon } from "../../../../components/Icon";
import type { IconName } from "../../../../components/Icon";

const steps: { id: "find" | "inspect" | "report"; icon: IconName; tone: string }[] = [
  { id: "find", icon: "search", tone: "bg-surface" },
  { id: "inspect", icon: "wrench", tone: "bg-brand-soft" },
  { id: "report", icon: "file", tone: "bg-saffron-soft" },
];

export function HowItWorks() {
  const { t } = useTranslation("listings");

  return (
    <section aria-labelledby="how-title" className="flex flex-col gap-32 px-20 md:px-48">
      <div className="flex flex-col gap-16 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-4">
          <p className="type-overline text-brand">{t("explore.how.overline")}</p>
          <h2 className="max-w-2xl type-h2 text-ink md:type-display-m" id="how-title">
            {t("explore.how.title")}
          </h2>
        </div>
        <p className="max-w-md type-body-l text-muted">{t("explore.how.description")}</p>
      </div>
      <ol className="grid gap-16 md:grid-cols-3 md:gap-24">
        {steps.map(({ id, icon, tone }, index) => (
          <li className={`flex flex-col gap-16 rounded-2xl p-24 shadow-elevation-1 md:p-32 ${tone}`} key={id}>
            <div className="flex items-start justify-between gap-16">
              <span className="flex size-48 items-center justify-center rounded-lg bg-ink text-surface">
                <Icon name={icon} size={22} />
              </span>
              <span aria-hidden="true" className="type-display-m text-line-strong">
                <bdi dir="ltr">{String(index + 1).padStart(2, "0")}</bdi>
              </span>
            </div>
            <h3 className="type-h3 text-ink">{t(`explore.how.steps.${id}.title`)}</h3>
            <p className="type-body-m text-ink-2">{t(`explore.how.steps.${id}.description`)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
