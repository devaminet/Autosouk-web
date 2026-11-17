import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { PageTitle } from "../../../components/PageTitle";
import { paths } from "../../../lib/paths";
import { useSession } from "../../auth/hooks";
import { hasSentFaceCheck, isFullyVerified } from "../api";

type RequireIdentityProps = {
  // Opens once the face video is sent, before an admin reviews it.
  allowPending?: boolean;
};

// Pages that change things, such as selling or inspecting, open once the
// phone and face checks passed. The API enforces it on every request; this
// only explains it. Place it under RequireRole, which makes sure of a user.
export function RequireIdentity({ allowPending = false }: RequireIdentityProps) {
  const { t } = useTranslation("identity");
  const { user } = useSession();

  if (!user || (allowPending ? hasSentFaceCheck(user) : isFullyVerified(user))) {
    return <Outlet />;
  }
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-16 p-24 text-center">
      <PageTitle>{t("required.title")}</PageTitle>
      <span className="flex size-96 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Icon name="scan-face" size={48} />
      </span>
      <h1 className="type-h1 text-ink">{t("required.title")}</h1>
      <p className="max-w-auth type-body-m text-muted">{t("required.description")}</p>
      <ButtonLink to={user.phoneVerified ? paths.verifyIdentity : paths.verifyPhone} variant="primary">
        {t("required.action")}
      </ButtonLink>
    </div>
  );
}
