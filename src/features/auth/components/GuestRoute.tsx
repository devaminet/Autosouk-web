import { useTranslation } from "react-i18next";
import { Navigate, Outlet } from "react-router";
import { paths } from "../../../lib/paths";
import { useSession } from "../hooks";

// Pages for people who are not signed in, such as log in and sign up.
export function GuestRoute() {
  const { t } = useTranslation();
  const { user, isPending } = useSession();

  if (isPending) {
    return (
      <output className="block p-24 type-body-m text-muted">{t("loading")}</output>
    );
  }
  if (user) {
    return <Navigate replace to={paths.home} />;
  }
  return <Outlet />;
}
