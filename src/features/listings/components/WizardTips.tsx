import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";

type WizardTipsProps = {
  tips: string[];
};

export function WizardTips({ tips }: WizardTipsProps) {
  const { t } = useTranslation("listings");

  return (
    <aside className="flex flex-col gap-12 rounded-xl border border-line bg-surface p-20">
      <h2 className="flex items-center gap-8 type-h5 text-ink">
        <Icon className="text-brand" name="info" size={18} />
        {t("wizard.tipsTitle")}
      </h2>
      <ul className="flex flex-col gap-12">
        {tips.map((tip) => (
          <li className="flex items-start gap-8 type-body-s text-ink-2" key={tip}>
            <Icon className="text-success" name="check" size={16} />
            {tip}
          </li>
        ))}
      </ul>
    </aside>
  );
}
