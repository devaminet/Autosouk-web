import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import { passwordRules } from "../passwordRules";

type PasswordStrengthProps = {
  password: string;
};

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { t } = useTranslation("auth");
  const rules = passwordRules(password);
  const metCount = rules.filter((rule) => rule.met).length;

  return (
    <div className="flex flex-col gap-8">
      <div aria-hidden="true" className="grid grid-cols-4 gap-4">
        {rules.map((rule, index) => (
          <span
            className={`h-4 rounded-full ${index < metCount ? "bg-success" : "bg-line"}`}
            key={rule.id}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-16 gap-y-8">
        {rules.map((rule) => (
          <li className="flex items-center gap-4 type-body-xs text-ink-2" key={rule.id}>
            <Icon
              className={rule.met ? "text-success" : "text-muted"}
              name={rule.met ? "check-circle" : "info"}
              size={14}
            />
            {t(`password.rules.${rule.id}`)}
            <span className="sr-only">
              {t(rule.met ? "password.met" : "password.notMet")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
