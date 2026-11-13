import { useTranslation } from "react-i18next";
import { Badge } from "../../../components/Badge";
import { ButtonLink } from "../../../components/ButtonLink";
import type { AuthUser } from "../../auth/api";
import { SettingsSection } from "../../auth/components/account/SettingsSection";
import { paths } from "../../../lib/paths";
import { nextVerificationStep } from "../api";

type IdentitySectionProps = {
  id: string;
  user: AuthUser;
};

const statusTones = {
  not_submitted: "neutral",
  pending: "info",
  approved: "success",
  rejected: "danger",
} as const;

// Where the user is with the phone and face checks, on the account page.
export function IdentitySection({ id, user }: IdentitySectionProps) {
  const { t } = useTranslation(["identity", "enums"]);
  const step = nextVerificationStep(user);
  const canRetry = user.identityStatus === "rejected";

  return (
    <SettingsSection description={t("account.description")} id={id} title={t("account.title")}>
      <dl className="flex flex-col divide-y divide-line">
        <div className="flex items-center justify-between gap-16 pb-16">
          <dt className="type-label-m text-ink">{t("account.phone")}</dt>
          <dd>
            <Badge tone={user.phoneVerified ? "success" : "neutral"}>
              {t(user.phoneVerified ? "account.phoneVerified" : "account.phoneNotVerified")}
            </Badge>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-16 pt-16">
          <dt className="type-label-m text-ink">{t("account.identity")}</dt>
          <dd>
            <Badge tone={statusTones[user.identityStatus]}>{t(`enums:identity_status.${user.identityStatus}`)}</Badge>
          </dd>
        </div>
      </dl>
      {(step || canRetry) && (
        <ButtonLink className="self-start" to={step === "phone" ? paths.verifyPhone : paths.verifyIdentity} variant="primary">
          {t("account.continue")}
        </ButtonLink>
      )}
    </SettingsSection>
  );
}
