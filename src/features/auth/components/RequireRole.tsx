import { useTranslation } from "react-i18next";
import { Navigate, Outlet, useLocation } from "react-router";
import { ButtonLink } from "../../../components/ButtonLink";
import { PageTitle } from "../../../components/PageTitle";
import { paths } from "../../../lib/paths";
import type { AuthUser } from "../api";
import { useSession } from "../hooks";

type RequireRoleProps = {
  allowed: AuthUser["role"];
};

// Only decides what to show. The API enforces the role on every request.
export function RequireRole({ allowed }: RequireRoleProps) {
  const { t } = useTranslation();
  const { user, isPending } = useSession();
  const { pathname, search } = useLocation();

  if (isPending) {
    return (
      <output className="block p-24 type-body-m text-muted">{t("loading")}</output>
    );
  }
  if (!user) {
    return (
      <Navigate replace state={{ from: `${pathname}${search}` }} to={paths.login} />
    );
  }
  if (user.role !== allowed) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-16 p-24 text-center">
        <PageTitle>{t("noAccess.title")}</PageTitle>
        <h1 className="type-h1 text-ink">{t("noAccess.title")}</h1>
        <p className="type-body-m text-muted">{t("noAccess.description")}</p>
        <ButtonLink to={paths.home} variant="primary">
          {t("noAccess.home")}
        </ButtonLink>
      </div>
    );
  }
  return <Outlet />;
}
