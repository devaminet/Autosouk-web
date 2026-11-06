import { useTranslation } from "react-i18next";
import { Navigate, Outlet, useLocation } from "react-router";
import { z } from "zod";
import { paths } from "../../../lib/paths";
import { useSession } from "../hooks";

// RequireRole sends this when it redirects someone to log in.
const returnSchema = z.object({ from: z.string() });

// Pages for people who are not signed in, such as log in and sign up.
export function GuestRoute() {
  const { t } = useTranslation();
  const { user, isPending } = useSession();
  const location = useLocation();

  if (isPending) {
    return (
      <output className="block p-24 type-body-m text-muted">{t("loading")}</output>
    );
  }
  if (user) {
    const target = returnSchema.safeParse(location.state);
    return <Navigate replace to={target.success ? target.data.from : paths.home} />;
  }
  return <Outlet />;
}
