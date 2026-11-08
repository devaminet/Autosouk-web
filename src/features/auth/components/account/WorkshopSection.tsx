import { useTranslation } from "react-i18next";
import { ButtonLink } from "../../../../components/ButtonLink";
import { Icon } from "../../../../components/Icon";
import { paths } from "../../../../lib/paths";
import { SettingsSection } from "./SettingsSection";

type WorkshopSectionProps = {
  id: string;
};

// For mechanics: the way to their workshop profile, which has its own page.
export function WorkshopSection({ id }: WorkshopSectionProps) {
  const { t } = useTranslation("auth");

  return (
    <SettingsSection description={t("account.workshop.description")} id={id} title={t("account.workshop.title")}>
      <ButtonLink className="self-start" to={paths.workshop} variant="dark">
        <Icon name="wrench" size={18} />
        {t("account.workshop.open")}
      </ButtonLink>
    </SettingsSection>
  );
}
