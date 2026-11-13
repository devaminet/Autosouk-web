import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button } from "../../../components/Button";
import { paths } from "../../../lib/paths";
import { useLogout } from "../../auth/hooks";

type StepActionProps = {
  step: string;
};

// The header of the check pages: where the user is, and a way out.
export function StepAction({ step }: StepActionProps) {
  const { t } = useTranslation("identity");
  const navigate = useNavigate();
  const logout = useLogout();

  return (
    <div className="flex items-center gap-12">
      <span className="hidden type-body-s text-muted md:inline">{step}</span>
      <Button
        isPending={logout.isPending}
        onClick={() => logout.mutate(undefined, { onSuccess: () => void navigate(paths.login) })}
        size="s"
      >
        {t("logOut")}
      </Button>
    </div>
  );
}
