import { useTranslation } from "react-i18next";
import { Icon } from "../../../../components/Icon";
import { LanguageSegmented } from "../../../../components/LanguageSegmented";
import { localeNames } from "../../../../lib/locale";
import type { AuthUser } from "../../api";
import { SettingsSection } from "./SettingsSection";

type LanguageSectionProps = {
  id: string;
  user: AuthUser;
};

export function LanguageSection({ id, user }: LanguageSectionProps) {
  const { t } = useTranslation("auth");

  return (
    <SettingsSection description={t("account.language.description")} id={id} title={t("account.language.title")}>
      <div className="max-w-lg">
        <LanguageSegmented label={t("account.language.switch")} />
      </div>
      <div className="flex items-start gap-12 rounded-lg bg-paper p-16">
        <Icon className="mt-2 text-muted" name="mail" size={20} />
        <div className="flex min-w-0 flex-col gap-4">
          <p className="type-label-m text-ink">
            {t("account.language.emails")}{" "}
            <span dir="auto" lang={user.locale}>
              {localeNames[user.locale]}
            </span>
          </p>
          <p className="type-body-s text-muted">{t("account.language.emailsDescription")}</p>
        </div>
      </div>
    </SettingsSection>
  );
}
