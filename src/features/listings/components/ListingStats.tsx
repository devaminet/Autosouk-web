import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import type { MyListings } from "../api";

const stats: { key: "approved" | "pending" | "draft"; icon: IconName }[] = [
  { key: "approved", icon: "car" },
  { key: "pending", icon: "clock" },
  { key: "draft", icon: "pencil" },
];

type ListingStatsProps = {
  counts: MyListings["meta"]["statusCounts"];
};

export function ListingStats({ counts }: ListingStatsProps) {
  const { t } = useTranslation("listings");

  return (
    <dl className="hidden gap-16 md:grid md:grid-cols-3">
      {stats.map(({ key, icon }) => (
        <div
          className="flex flex-col gap-12 rounded-xl border border-line bg-surface p-20"
          key={key}
        >
          <div className="flex items-center justify-between gap-8">
            <dt className="type-label-m text-muted">{t(`stats.${key}.label`)}</dt>
            <span className="flex size-32 shrink-0 items-center justify-center rounded-md bg-paper text-ink">
              <Icon name={icon} size={16} />
            </span>
          </div>
          <dd className="type-display-m text-ink">
            <bdi dir="ltr">{counts[key] ?? 0}</bdi>
          </dd>
          <dd className="type-label-s text-muted">{t(`stats.${key}.hint`)}</dd>
        </div>
      ))}
    </dl>
  );
}
