import { useTranslation } from "react-i18next";
import { Button } from "../../../../components/Button";
import { Icon } from "../../../../components/Icon";
import { useLogout } from "../../hooks";

type LogOutSectionProps = {
  id: string;
};

export function LogOutSection({ id }: LogOutSectionProps) {
  const { t } = useTranslation("auth");
  const logout = useLogout();
  const titleId = `${id}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className="flex scroll-mt-24 flex-col gap-16 rounded-xl border border-line bg-surface p-20 sm:flex-row sm:items-center md:p-32"
      id={id}
    >
      <Icon className="hidden text-danger sm:block" name="logout" size={22} />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <h2 className="type-label-l text-ink" id={titleId}>
          {t("account.logOut.title")}
        </h2>
        <p className="type-body-s text-muted">{t("account.logOut.description")}</p>
        {logout.isError && (
          <p className="type-body-xs text-danger" role="alert">
            {t("common:errors.unexpected")}
          </p>
        )}
      </div>
      <Button className="self-start sm:self-auto" isPending={logout.isPending} onClick={() => logout.mutate()} variant="danger">
        {t("common:nav.logOut")}
      </Button>
    </section>
  );
}
