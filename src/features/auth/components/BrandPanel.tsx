import { useTranslation } from "react-i18next";
import { Badge } from "../../../components/Badge";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { Logo } from "../../../components/Logo";

const points: { id: string; icon: IconName }[] = [
  { id: "mechanics", icon: "shield" },
  { id: "report", icon: "file" },
  { id: "city", icon: "map-pin" },
];

// The signup page's marketing panel, on large screens only.
export function BrandPanel() {
  const { t } = useTranslation("auth");

  return (
    <aside className="relative hidden w-2/5 max-w-brand shrink-0 flex-col justify-between gap-48 overflow-hidden bg-night p-48 lg:flex">
      <div aria-hidden="true" className="absolute inset-0 bg-zellige" />
      <div
        aria-hidden="true"
        className="absolute -inset-s-96 -bottom-96 aspect-square w-full rounded-full bg-brand opacity-55 blur-3xl"
      />
      <div className="relative flex flex-col gap-48">
        <Logo tone="dark" />
        <div className="flex flex-col gap-20">
          <Badge tone="brand">{t("brand.badge")}</Badge>
          <p className="type-display-l text-surface">
            {t("brand.titleLine1")}
            <br />
            {t("brand.titleLine2")}
          </p>
          <p className="type-body-l text-subtle">{t("brand.description")}</p>
        </div>
        <ul className="flex flex-col gap-16">
          {points.map(({ id, icon }) => (
            <li className="flex items-center gap-16" key={id}>
              <span className="flex size-48 shrink-0 items-center justify-center rounded-md bg-night-2 text-saffron ring-1 ring-brand-ink ring-inset">
                <Icon name={icon} size={22} />
              </span>
              <span className="flex flex-col gap-2">
                <span className="type-h5 text-surface">
                  {t(`brand.points.${id}.title`)}
                </span>
                <span className="type-body-s text-subtle">
                  {t(`brand.points.${id}.description`)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
