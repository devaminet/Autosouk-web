import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { z } from "zod";
import { Alert } from "../../../components/Alert";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { Pagination } from "../../../components/Pagination";
import { SelectField } from "../../../components/SelectField";
import { formatDate, formatNumber } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import { adminUserPath } from "../../../lib/paths";
import { identityStatuses } from "../../auth/api";
import { AdminPage } from "../components/AdminPage";
import { AdminTable } from "../components/AdminTable";
import type { Column } from "../components/AdminTable";
import { FilterTabs } from "../components/FilterTabs";
import { ListSearch } from "../components/ListSearch";
import { useAdminOverview, useUsers } from "../hooks";
import { useListParams } from "../listParams";
import type { UserSummary } from "../usersApi";
import { roles } from "../verificationsApi";

const filterKeys = ["search", "role", "identityStatus", "status"] as const;

// A message from the page that sent the admin here, such as after a deletion.
const noticeSchema = z.object({ notice: z.string() });

const faceTones = { not_submitted: "neutral", pending: "warning", approved: "success", rejected: "danger" } as const;

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-4 type-body-xs ${ok ? "text-ink-2" : "text-muted"}`}>
      <Icon className={ok ? "text-success" : "text-muted"} name={ok ? "check-circle" : "x"} size={14} />
      {label}
    </span>
  );
}

// Every account, with filters kept in the link.
export function AdminUsersPage() {
  const { t } = useTranslation(["admin", "enums"]);
  const { page, values, set, hrefFor } = useListParams(filterKeys);
  const users = useUsers({ page, ...values });
  const overview = useAdminOverview();
  const locale = getLocale();
  const totals = overview.data?.users;
  const notice = noticeSchema.safeParse(useLocation().state);

  const statusHref = (status: string) => {
    const params = new URLSearchParams(hrefFor(1).slice(1));
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    const query = params.toString();
    return query ? `?${query}` : "?";
  };

  const columns: Column<UserSummary>[] = [
    {
      header: t("users.list.user"),
      cell: (user) => (
        <span className="flex flex-col gap-2">
          <span className="type-label-m text-ink" dir="auto">
            {user.firstName} {user.lastName}
          </span>
          <span className="type-body-xs text-muted">
            <bdi dir="auto">{user.email}</bdi> · <bdi dir="ltr">{user.phone}</bdi>
          </span>
        </span>
      ),
    },
    {
      header: t("users.list.role"),
      cell: (user) => <Badge tone={user.role === "mechanic" ? "brand" : user.role === "admin" ? "success" : "neutral"}>{t(`enums:role.${user.role}`)}</Badge>,
    },
    {
      header: t("users.list.checks"),
      cell: (user) => (
        <span className="flex flex-col gap-2">
          <Check label={t("users.list.email")} ok={user.emailVerified === true} />
          <Check label={t("users.list.phone")} ok={user.phoneVerifiedAt !== null} />
          <Badge tone={faceTones[user.identityStatus]}>{t(`enums:identity_status.${user.identityStatus}`)}</Badge>
        </span>
      ),
    },
    {
      header: t("users.list.status"),
      cell: (user) =>
        user.suspendedAt ? (
          <Badge tone="danger">{t("users.list.suspended")}</Badge>
        ) : (
          <Badge tone="success">{t("users.list.active")}</Badge>
        ),
    },
    { header: t("users.list.joined"), cell: (user) => formatDate(user.createdAt, locale) },
    {
      header: t("users.list.actions"),
      align: "end",
      cell: (user) => (
        <ButtonLink
          aria-label={t("users.list.openNamed", { name: `${user.firstName} ${user.lastName}` })}
          size="s"
          to={adminUserPath(user.id)}
        >
          {t("users.list.open")}
        </ButtonLink>
      ),
    },
  ];

  const content = () => {
    if (users.isError) {
      return (
        <div className="flex flex-col items-start gap-12" role="alert">
          <Alert tone="danger">{users.error.message}</Alert>
          <Button onClick={() => void users.refetch()}>{t("retry")}</Button>
        </div>
      );
    }
    if (users.isPending) {
      return <output className="type-body-m text-muted">{t("loading")}</output>;
    }
    const { meta } = users.data;
    const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
    return (
      <>
        <AdminTable
          caption={t("users.list.caption")}
          columns={columns}
          empty={t("users.list.empty")}
          rowKey={(user) => user.id}
          rows={users.data.users}
        />
        <div className="flex flex-wrap items-center justify-between gap-12">
          <p className="type-body-s text-muted">
            <bdi dir="ltr">
              {t("users.list.range", {
                from: formatNumber(from),
                to: formatNumber(Math.min(meta.page * meta.limit, meta.total)),
                total: formatNumber(meta.total),
              })}
            </bdi>
          </p>
          <Pagination hrefFor={hrefFor} page={meta.page} totalPages={meta.totalPages} />
        </div>
      </>
    );
  };

  return (
    <AdminPage description={t("users.list.description")} title={t("users.list.title")}>
      <output className="empty:hidden">{notice.success && <Alert tone="success">{notice.data.notice}</Alert>}</output>
      <div className="flex flex-wrap items-end gap-12">
        <ListSearch
          label={t("users.list.search")}
          onSearch={(search) => set({ search })}
          placeholder={t("users.list.searchPlaceholder")}
          value={values.search}
        />
        <SelectField
          fieldClassName="w-full sm:w-auto"
          label={t("users.list.role")}
          onChange={(event) => set({ role: event.target.value })}
          value={values.role}
        >
          <option value="">{t("users.list.allRoles")}</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {t(`enums:role.${role}`)}
            </option>
          ))}
        </SelectField>
        <SelectField
          fieldClassName="w-full sm:w-auto"
          label={t("users.list.faceCheck")}
          onChange={(event) => set({ identityStatus: event.target.value })}
          value={values.identityStatus}
        >
          <option value="">{t("users.list.anyFaceCheck")}</option>
          {identityStatuses.map((status) => (
            <option key={status} value={status}>
              {t(`enums:identity_status.${status}`)}
            </option>
          ))}
        </SelectField>
      </div>
      <FilterTabs
        current={values.status}
        hrefFor={statusHref}
        items={[
          { value: "", label: t("users.list.all"), count: totals?.total },
          { value: "active", label: t("users.list.active"), count: totals ? totals.total - totals.suspended : undefined },
          { value: "suspended", label: t("users.list.suspended"), count: totals?.suspended },
        ]}
        label={t("users.list.statusLabel")}
      />
      {content()}
    </AdminPage>
  );
}
