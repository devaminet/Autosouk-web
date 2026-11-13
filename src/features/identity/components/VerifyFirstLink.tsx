import { useTranslation } from "react-i18next";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { paths } from "../../../lib/paths";
import type { AuthUser } from "../../auth/api";

type VerifyFirstLinkProps = {
  user: AuthUser;
};

// Stands in for an action the user can't take before passing the checks,
// such as asking for an inspection, and leads to the check left to do.
export function VerifyFirstLink({ user }: VerifyFirstLinkProps) {
  const { t } = useTranslation("identity");

  return (
    <ButtonLink block size="l" to={user.phoneVerified ? paths.verifyIdentity : paths.verifyPhone}>
      <Icon name="lock" size={18} />
      {t("required.locked")}
    </ButtonLink>
  );
}
