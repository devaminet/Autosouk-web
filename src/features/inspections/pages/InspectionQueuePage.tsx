import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { Alert } from "../../../components/Alert";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { PageTitle } from "../../../components/PageTitle";
import { formatNumber } from "../../../lib/format";
import { paths } from "../../../lib/paths";
import { useMechanic, useOwnMechanic } from "../../mechanics/hooks";
import type { QueuedInspection } from "../api";
import { QueueCard } from "../components/QueueCard";
import { QueueStats } from "../components/QueueStats";
import { useQueue } from "../hooks";
import { isQueueColumn, queueColumns, queueStats } from "../queue";
import type { QueueColumn } from "../queue";

const dots: Record<QueueColumn, string> = {
  pending: "bg-warning",
  accepted: "bg-brand",
  in_progress: "bg-info",
  completed: "bg-success",
};

type ColumnProps = {
  column: QueueColumn;
  inspections: QueuedInspection[];
  // Small screens show one column at a time.
  isShownOnSmall: boolean;
};

function Column({ column, inspections, isShownOnSmall }: ColumnProps) {
  const { t } = useTranslation("inspections");
  const headingId = `queue-${column}`;

  return (
    <section
      aria-labelledby={headingId}
      className={`flex-col gap-12 rounded-2xl md:border md:border-line md:bg-surface-2 md:p-12 ${isShownOnSmall ? "flex" : "hidden md:flex"}`}
    >
      <h2 className="sr-only items-center gap-8 px-4 pt-4 type-h4 text-ink md:not-sr-only md:flex" id={headingId}>
        <span aria-hidden="true" className={`size-8 rounded-full ${dots[column]}`} />
        <span className="flex-1">{t(`queue.columns.${column}`)}</span>{" "}
        <bdi className="rounded-full bg-line px-8 type-label-s text-ink-2" dir="ltr">
          {formatNumber(inspections.length)}
        </bdi>
      </h2>
      {inspections.length === 0 ? (
        <p className="px-4 py-12 type-body-s text-muted">{t(`queue.empty.${column}`)}</p>
      ) : (
        <ul className="flex flex-col gap-12">
          {inspections.map((inspection) => (
            <li key={inspection.id}>
              <QueueCard inspection={inspection} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type ColumnPickerProps = {
  selected: QueueColumn;
  counts: Record<QueueColumn, number>;
};

// The status pills of small screens. Wide screens show every column.
function ColumnPicker({ selected, counts }: ColumnPickerProps) {
  const { t } = useTranslation("inspections");

  return (
    <nav aria-label={t("queue.columns.label")} className="md:hidden">
      <ul className="no-scrollbar flex gap-8 overflow-x-auto">
        {queueColumns.map((column) => {
          const isActive = column === selected;
          return (
            <li className="shrink-0" key={column}>
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-control-m items-center gap-8 rounded-full px-16 type-label-m focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${isActive ? "bg-ink text-surface" : "bg-surface text-ink ring-1 ring-line-strong ring-inset"}`}
                preventScrollReset
                replace
                to={{ search: column === "pending" ? "" : `?status=${column}` }}
              >
                {t(`queue.columns.${column}`)}{" "}
                <bdi dir="ltr">{formatNumber(counts[column])}</bdi>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// The mechanic's inspection requests, from new to completed.
export function InspectionQueuePage() {
  const { t } = useTranslation("inspections");
  const own = useOwnMechanic();
  const mechanic = own.data ?? null;
  const queue = useQueue(mechanic !== null);
  // The public profile carries the rating.
  const profile = useMechanic(mechanic?.id ?? null);
  const [params] = useSearchParams();
  const status = params.get("status");
  const selected = isQueueColumn(status) ? status : "pending";

  const byColumn = useMemo(() => {
    const groups: Record<QueueColumn, QueuedInspection[]> = {
      pending: [],
      accepted: [],
      in_progress: [],
      completed: [],
    };
    for (const inspection of queue.data ?? []) {
      if (isQueueColumn(inspection.status)) {
        groups[inspection.status].push(inspection);
      }
    }
    return groups;
  }, [queue.data]);

  const content = () => {
    if (own.error || queue.error) {
      return (
        <div className="flex flex-col items-start gap-12" role="alert">
          <Alert tone="danger">{(own.error ?? queue.error)?.message}</Alert>
          <Button onClick={() => void (own.error ? own.refetch() : queue.refetch())}>{t("queue.retry")}</Button>
        </div>
      );
    }
    if (own.isSuccess && mechanic === null) {
      return (
        <div className="flex flex-col items-start gap-16 rounded-xl border border-line bg-surface p-24">
          <p className="type-body-m text-ink-2">{t("queue.noWorkshop")}</p>
          <ButtonLink to={paths.workshop} variant="dark">
            {t("queue.setUp")}
          </ButtonLink>
        </div>
      );
    }
    if (!queue.data) {
      return <output className="block type-body-m text-muted">{t("common:loading")}</output>;
    }

    // When the queue was loaded, so the figures stay put between renders.
    const now = new Date(queue.dataUpdatedAt);
    const counts = {
      pending: byColumn.pending.length,
      accepted: byColumn.accepted.length,
      in_progress: byColumn.in_progress.length,
      completed: byColumn.completed.length,
    };
    return (
      <>
        <QueueStats now={now} rating={profile.data?.rating ?? null} {...queueStats(queue.data, now)} />
        <ColumnPicker counts={counts} selected={selected} />
        <div aria-busy={queue.isFetching} className="grid grid-cols-1 items-start gap-16 md:grid-cols-2 lg:grid-cols-4">
          {queueColumns.map((column) => (
            <Column
              column={column}
              inspections={byColumn[column]}
              isShownOnSmall={column === selected}
              key={column}
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col gap-24 px-20 py-24 md:px-48 md:py-40 lg:px-80">
      <PageTitle>{t("queue.title")}</PageTitle>
      <header className="flex flex-wrap items-end justify-between gap-16">
        <div className="flex min-w-0 flex-col gap-4">
          {mechanic && (
            <p className="type-overline text-brand" dir="auto">
              {mechanic.name}
            </p>
          )}
          <h1 className="type-h1 text-ink md:type-display-m">{t("queue.title")}</h1>
        </div>
        {mechanic && (
          <div className="flex flex-wrap items-center gap-12">
            <Badge tone={mechanic.isActive ? "success" : "warning"}>
              {t(mechanic.isActive ? "queue.accepting" : "queue.paused")}
            </Badge>
            <ButtonLink to={paths.workshop}>
              <Icon name="wrench" size={18} />
              {t("queue.workshop")}
            </ButtonLink>
          </div>
        )}
      </header>
      {content()}
    </div>
  );
}
