import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { signupRoles } from "../api";
import type { SignupRole } from "../api";

const roleIcons: Record<SignupRole, IconName> = {
  buyer: "car",
  seller: "grid",
  mechanic: "wrench",
};

type RoleSelectorProps = {
  error?: string;
};

export function RoleSelector({ error }: RoleSelectorProps) {
  const { t } = useTranslation(["auth", "enums"]);

  return (
    <fieldset className="min-w-0">
      <legend className="pb-8 type-label-m text-ink">
        {t("register.roleLegend")}
      </legend>
      <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
        {signupRoles.map((role) => (
          // oxlint-disable-next-line jsx-a11y/label-has-associated-control -- the text is nested deeper than the rule checks.
          <label
            className="group flex cursor-pointer items-center gap-12 rounded-lg bg-surface p-16 ring-1 ring-line ring-inset has-checked:bg-brand-soft has-checked:ring-2 has-checked:ring-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand md:flex-col md:items-stretch"
            key={role}
          >
            <span className="flex shrink-0 items-center justify-between">
              <span className="flex size-40 items-center justify-center rounded-md bg-paper text-ink group-has-checked:bg-brand group-has-checked:text-on-brand">
                <Icon name={roleIcons[role]} size={20} />
              </span>
              <input
                className="sr-only"
                defaultChecked={role === "buyer"}
                name="userType"
                type="radio"
                value={role}
              />
              <span
                aria-hidden="true"
                className="hidden size-20 rounded-full bg-surface ring-2 ring-line-strong ring-inset group-has-checked:ring-6 group-has-checked:ring-brand md:block"
              />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="type-h5 text-ink">{t(`enums:role.${role}`)}</span>
              <span className="type-body-s text-muted">
                {t(`register.roles.${role}`)}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="size-20 shrink-0 rounded-full bg-surface ring-2 ring-line-strong ring-inset group-has-checked:ring-6 group-has-checked:ring-brand md:hidden"
            />
          </label>
        ))}
      </div>
      {error && <p className="pt-8 type-body-xs text-danger">{error}</p>}
    </fieldset>
  );
}
