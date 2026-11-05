import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type { ListingStatus, MyListings } from "../api";
import { myListingsSearch } from "../myListingsSearch";

// Withdrawn and sold have no filter because the API offers no way to set them.
const filters: readonly ListingStatus[] = ["approved", "pending", "draft", "rejected"];

type TabProps = {
  label: string;
  count: number;
  status?: ListingStatus;
  isActive: boolean;
};

function Tab({ label, count, status, isActive }: TabProps) {
  return (
    <li className="shrink-0">
      <Link
        aria-current={isActive ? "page" : undefined}
        className={`flex min-h-control-m items-center gap-8 rounded-full px-16 type-label-m focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand md:rounded-none md:border-b-2 md:px-2 ${
          isActive
            ? "bg-ink text-surface md:border-ink md:bg-transparent md:text-ink"
            : "bg-surface text-muted ring-1 ring-line-strong ring-inset hover:text-ink md:border-transparent md:bg-transparent md:ring-0"
        }`}
        preventScrollReset
        to={{ search: myListingsSearch({ status, page: 1 }) }}
      >
        {label}{" "}
        <bdi
          className={`rounded-full px-4 type-mono-s ${
            isActive ? "bg-surface text-ink md:bg-ink md:text-surface" : "bg-line text-ink-2"
          }`}
          dir="ltr"
        >
          {count}
        </bdi>
      </Link>
    </li>
  );
}

type StatusTabsProps = {
  active?: ListingStatus;
  counts: MyListings["meta"]["statusCounts"];
};

export function StatusTabs({ active, counts }: StatusTabsProps) {
  const { t } = useTranslation(["listings", "enums"]);
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <nav aria-label={t("tabs.label")}>
      <ul className="no-scrollbar flex gap-8 overflow-x-auto md:gap-24 md:border-b md:border-line">
        <Tab count={total} isActive={!active} label={t("tabs.all")} />
        {filters.map((status) => (
          <Tab
            count={counts[status] ?? 0}
            isActive={active === status}
            key={status}
            label={t(`enums:listing_status.${status}`)}
            status={status}
          />
        ))}
      </ul>
    </nav>
  );
}
