import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/Alert";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { formatTimeAgo } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import { adminVerificationPath } from "../../../lib/paths";
import { AdminPage } from "../components/AdminPage";
import { AdminTable } from "../components/AdminTable";
import type { Column } from "../components/AdminTable";
import { useVerifications } from "../hooks";
import type { QueuedVerification } from "../verificationsApi";

// Everyone with something waiting for a check, longest waiting first.
export function AdminVerificationsPage() {
  const { t } = useTranslation(["admin", "enums"]);
  const queue = useVerifications();
  const locale = getLocale();

  const columns: Column<QueuedVerification>[] = [
    {
      header: t("verifications.queue.person"),
      cell: ({ user, mechanic }) => (
        <span className="flex flex-col gap-2">
          <span className="type-label-m text-ink" dir="auto">
            {user.firstName} {user.lastName}
          </span>
          <span className="type-body-xs text-muted" dir="auto">
            {mechanic ? [mechanic.name, mechanic.kind && t(`enums:mechanic_kind.${mechanic.kind}`)].filter(Boolean).join(" · ") : user.email}
          </span>
        </span>
      ),
    },
    {
      header: t("verifications.queue.role"),
      cell: ({ user }) => <Badge tone={user.role === "mechanic" ? "brand" : "neutral"}>{t(`enums:role.${user.role}`)}</Badge>,
    },
    {
      header: t("verifications.queue.waiting"),
      cell: ({ waiting, resent }) => (
        <span className="flex flex-col gap-4">
          <span className="flex flex-wrap gap-4">
            {waiting.faceCheck && <Badge tone="info">{t("verifications.queue.faceVideo")}</Badge>}
            {waiting.documents > 0 && (
              <Badge tone="brand">{t("verifications.queue.documents", { count: waiting.documents })}</Badge>
            )}
          </span>
          {resent && <span className="type-body-xs text-warning">{t("verifications.queue.resent")}</span>}
        </span>
      ),
    },
    {
      header: t("verifications.queue.since"),
      cell: ({ since }) => (since ? formatTimeAgo(since, locale) : null),
    },
    {
      header: t("verifications.queue.actions"),
      align: "end",
      cell: ({ user }) => (
        <ButtonLink
          aria-label={t("verifications.queue.reviewNamed", { name: `${user.firstName} ${user.lastName}` })}
          size="s"
          to={adminVerificationPath(user.id)}
          variant="dark"
        >
          {t("verifications.queue.review")}
        </ButtonLink>
      ),
    },
  ];

  const content = () => {
    if (queue.isError) {
      return (
        <div className="flex flex-col items-start gap-12" role="alert">
          <Alert tone="danger">{queue.error.message}</Alert>
          <Button onClick={() => void queue.refetch()}>{t("retry")}</Button>
        </div>
      );
    }
    if (queue.isPending) {
      return <output className="type-body-m text-muted">{t("loading")}</output>;
    }
    return (
      <AdminTable
        caption={t("verifications.queue.caption")}
        columns={columns}
        empty={t("verifications.queue.empty")}
        rowKey={({ user }) => user.id}
        rows={queue.data}
      />
    );
  };

  return (
    <AdminPage description={t("verifications.queue.description")} title={t("verifications.queue.title")}>
      {content()}
      <p className="flex items-start gap-8 rounded-md bg-info-soft p-12 type-body-s text-info">
        <Icon className="mt-2 shrink-0" name="info" size={16} />
        {t("verifications.queue.note")}
      </p>
    </AdminPage>
  );
}
