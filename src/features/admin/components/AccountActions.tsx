import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { paths } from "../../../lib/paths";
import { useSession } from "../../auth/hooks";
import { useDeleteUser, useReactivateUser, useSuspendUser } from "../hooks";
import type { AdminUser } from "../usersApi";
import { ReasonDialog } from "./ReasonDialog";

type Open = "suspend" | "delete" | null;

// A translated list, such as a dialog's consequences.
const lines = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

type AccountActionsProps = {
  user: AdminUser;
};

// Suspend, lift the suspension, or delete. Admins can't act on themselves or
// on another admin, and a mechanic whose inspections buyers rely on can only
// be suspended.
export function AccountActions({ user }: AccountActionsProps) {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const session = useSession();
  const suspend = useSuspendUser();
  const reactivate = useReactivateUser();
  const remove = useDeleteUser();
  const [open, setOpen] = useState<Open>(null);
  const name = `${user.firstName} ${user.lastName}`;

  if (user.role === "admin" || session.user?.id === user.id) {
    return null;
  }

  const inspections = user.mechanic?.inspections ?? 0;
  const done = suspend.isSuccess ? "suspended" : reactivate.isSuccess ? "reactivated" : null;

  return (
    <section aria-label={t("users.detail.actions")} className="flex flex-col gap-12">
      <div className="flex flex-wrap items-start gap-8">
        {user.suspendedAt ? (
          <Button
            isPending={reactivate.isPending}
            onClick={() => {
              suspend.reset();
              reactivate.mutate(user.id);
            }}
            variant="dark"
          >
            <Icon name="refresh" size={16} />
            {t("users.detail.reactivate")}
          </Button>
        ) : (
          <Button
            onClick={() => {
              reactivate.reset();
              setOpen("suspend");
            }}
            variant="danger"
          >
            <Icon name="lock" size={16} />
            {t("users.detail.suspend")}
          </Button>
        )}
        <div className="flex flex-col gap-4">
          <Button aria-describedby={inspections > 0 ? "delete-blocked" : undefined} disabled={inspections > 0} onClick={() => setOpen("delete")}>
            <Icon name="trash" size={16} />
            {t("users.detail.delete")}
          </Button>
          {inspections > 0 && (
            <p className="type-body-xs text-muted" id="delete-blocked">
              {t("users.detail.deleteBlocked", { count: inspections })}
            </p>
          )}
        </div>
      </div>
      <output className="empty:hidden">
        {done && <Alert tone="success">{t(`users.detail.${done}`, { name: user.firstName })}</Alert>}
      </output>
      <div className="empty:hidden" role="alert">
        {reactivate.error && <Alert tone="danger">{reactivate.error.message}</Alert>}
      </div>
      <ReasonDialog
        confirmIcon="lock"
        confirmLabel={t("users.detail.suspendDialog.confirm")}
        consequences={lines(t("users.detail.suspendDialog.consequences", { returnObjects: true }))}
        description={t("users.detail.suspendDialog.description")}
        error={suspend.error?.message ?? null}
        helper={t("users.detail.suspendDialog.helper")}
        isPending={suspend.isPending}
        label={t("users.detail.suspendDialog.label")}
        onClose={() => {
          setOpen(null);
          if (suspend.isError) {
            suspend.reset();
          }
        }}
        onConfirm={(reason) => suspend.mutate({ userId: user.id, reason }, { onSuccess: () => setOpen(null) })}
        open={open === "suspend"}
        title={t("users.detail.suspendDialog.title", { name })}
      />
      <ReasonDialog
        confirmIcon="trash"
        confirmLabel={t("users.detail.deleteDialog.confirm")}
        consequences={lines(t("users.detail.deleteDialog.consequences", { returnObjects: true }))}
        description={t("users.detail.deleteDialog.description")}
        error={remove.error?.message ?? null}
        helper={t("users.detail.deleteDialog.helper")}
        isPending={remove.isPending}
        label={t("users.detail.deleteDialog.label")}
        onClose={() => {
          setOpen(null);
          remove.reset();
        }}
        onConfirm={(reason) =>
          remove.mutate(
            { userId: user.id, reason },
            {
              onSuccess: () =>
                void navigate(paths.adminUsers, { state: { notice: t("users.detail.deleted", { name }) } }),
            },
          )
        }
        open={open === "delete"}
        title={t("users.detail.deleteDialog.title", { name })}
      />
    </section>
  );
}
