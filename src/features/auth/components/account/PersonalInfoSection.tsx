import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { AuthUser } from "../../api";
import { useCityOptions } from "../../hooks";
import { SettingsSection } from "./SettingsSection";

type DetailProps = {
  label: string;
  helper?: string;
  children: ReactNode;
};

function Detail({ label, helper, children }: DetailProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <dt className="type-label-m text-muted">{label}</dt>
      <dd className="type-body-m break-words text-ink">{children}</dd>
      {helper && <dd className="type-body-xs text-muted">{helper}</dd>}
    </div>
  );
}

type PersonalInfoSectionProps = {
  id: string;
  user: AuthUser;
};

// Read only: the API has no way to change these details yet.
export function PersonalInfoSection({ id, user }: PersonalInfoSectionProps) {
  const { t } = useTranslation("auth");
  const cities = useCityOptions();
  const city = cities.options.find((option) => option.id === user.cityId)?.label;

  return (
    <SettingsSection description={t("account.personal.description")} id={id} title={t("account.personal.title")}>
      <dl className="grid gap-20 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label={t("fields.firstName")}>
          <span dir="auto">{user.firstName}</span>
        </Detail>
        <Detail label={t("fields.lastName")}>
          <span dir="auto">{user.lastName}</span>
        </Detail>
        <Detail
          helper={user.isVerified ? t("account.emailVerified") : undefined}
          label={t("fields.email")}
        >
          <bdi dir="ltr">{user.email}</bdi>
        </Detail>
        <Detail label={t("fields.phone")}>
          <bdi dir="ltr">{user.phone}</bdi>
        </Detail>
        <Detail label={t("fields.city")}>{city ?? t("account.personal.noCity")}</Detail>
      </dl>
    </SettingsSection>
  );
}
