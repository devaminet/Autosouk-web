import { Link } from "react-router";
import { formatNumber } from "../../../lib/format";

type FilterTabsProps = {
  label: string;
  items: { value: string; label: string; count?: number }[];
  current: string;
  // The link that shows the list with this value.
  hrefFor: (value: string) => string;
};

// Quick filters as links, so each one can be shared and the back button works.
export function FilterTabs({ label, items, current, hrefFor }: FilterTabsProps) {
  return (
    <nav aria-label={label} className="no-scrollbar overflow-x-auto">
      <ul className="flex w-fit gap-4 rounded-full bg-surface p-4 ring-1 ring-line ring-inset">
        {items.map((item) => {
          const selected = item.value === current;
          return (
            <li key={item.value}>
              <Link
                aria-current={selected ? "page" : undefined}
                className={`flex items-center gap-8 rounded-full px-12 py-8 type-label-s whitespace-nowrap focus-visible:outline-2 focus-visible:outline-brand ${selected ? "bg-ink text-surface" : "text-ink-2 hover:bg-surface-2"}`}
                replace
                to={hrefFor(item.value)}
              >
                {item.label}
                {item.count !== undefined && (
                  <>
                    {" "}
                    <bdi className={selected ? "text-subtle" : "text-muted"} dir="ltr">
                      {formatNumber(item.count)}
                    </bdi>
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
