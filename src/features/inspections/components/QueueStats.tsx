import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { formatNumber } from "../../../lib/format";

type Stat = {
  label: string;
  value: string;
  hint: string;
  icon: IconName;
  // Colours the hint, as the design does for each figure.
  tone: "warning" | "success" | "muted";
};

const hintTones: Record<Stat["tone"], string> = {
  warning: "text-warning",
  success: "text-success",
  muted: "text-muted",
};

type QueueStatsProps = {
  pending: number;
  lastWeek: number;
  weekChange: number;
  // Null without reviews.
  rating: { average: number | null; count: number } | null;
  completedThisMonth: number;
  earnedThisMonth: number;
  now: Date;
};

// The mechanic's figures at a glance, above the queue.
export function QueueStats({
  pending,
  lastWeek,
  weekChange,
  rating,
  completedThisMonth,
  earnedThisMonth,
  now,
}: QueueStatsProps) {
  const { t, i18n } = useTranslation("inspections");
  const month = new Intl.DateTimeFormat(i18n.language, { month: "short" }).format(now);
  const average = rating?.average ?? null;
  const stats: Stat[] = [
    {
      label: t("queue.stats.new"),
      value: formatNumber(pending),
      hint: t("queue.stats.newHint"),
      icon: "inbox",
      tone: pending > 0 ? "warning" : "muted",
    },
    {
      label: t("queue.stats.week"),
      value: formatNumber(lastWeek),
      hint: t("queue.stats.weekHint", { change: `${weekChange > 0 ? "+" : ""}${formatNumber(weekChange)}` }),
      icon: "calendar",
      tone: weekChange > 0 ? "success" : "muted",
    },
    {
      label: t("queue.stats.rating"),
      value: average === null ? "–" : average.toFixed(1),
      hint: average === null ? t("queue.stats.noRating") : t("queue.stats.reviews", { count: rating?.count ?? 0 }),
      icon: "star",
      tone: average === null ? "muted" : "success",
    },
    {
      label: t("queue.stats.month", { month }),
      value: formatNumber(completedThisMonth),
      hint: t("queue.stats.earned", { amount: formatNumber(earnedThisMonth) }),
      icon: "award",
      tone: completedThisMonth > 0 ? "success" : "muted",
    },
  ];

  return (
    <dl aria-label={t("queue.stats.label")} className="hidden gap-16 md:grid md:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, value, hint, icon, tone }) => (
        <div className="flex flex-col gap-12 rounded-xl border border-line bg-surface p-20" key={icon}>
          <div className="flex items-center justify-between gap-8">
            <dt className="type-label-m text-muted">{label}</dt>
            <span className="flex size-32 shrink-0 items-center justify-center rounded-md bg-paper text-ink">
              <Icon name={icon} size={16} />
            </span>
          </div>
          <dd className="type-display-m text-ink">
            <bdi dir="ltr">{value}</bdi>
          </dd>
          <dd className={`type-label-s ${hintTones[tone]}`}>{hint}</dd>
        </div>
      ))}
    </dl>
  );
}
