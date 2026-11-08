import { useId, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { formatNumber } from "../lib/format";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

export type Tab<Id extends string> = {
  id: Id;
  label: string;
  count?: number;
  // Shown before the label, such as a check on a finished section.
  icon?: IconName;
  panel: ReactNode;
};

type TabsProps<Id extends string> = {
  label: string;
  tabs: Tab<Id>[];
  selected: Id;
  onSelect: (id: Id) => void;
  // Underlined labels, or a row of pills.
  appearance?: "underline" | "pills";
};

const looks = {
  underline: {
    list: "flex gap-32 border-b border-line",
    tab: "-mb-px border-b-2 py-12 focus-visible:-outline-offset-2",
    selected: "border-ink text-ink",
    idle: "border-transparent text-muted hover:text-ink",
  },
  pills: {
    list: "flex gap-8",
    tab: "min-h-control-m rounded-full px-16 focus-visible:outline-offset-2",
    selected: "bg-ink text-surface",
    idle: "bg-surface text-ink ring-1 ring-line-strong ring-inset hover:bg-surface-2",
  },
};

// Tabs over a page's sections. The arrow keys move between tabs, and only the
// selected tab is in the tab order.
export function Tabs<Id extends string>({ label, tabs, selected, onSelect, appearance = "underline" }: TabsProps<Id>) {
  const look = looks[appearance];
  const baseId = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (event: KeyboardEvent, index: number) => {
    // Next and previous follow the reading direction.
    const forward = document.documentElement.dir === "rtl" ? "ArrowLeft" : "ArrowRight";
    const backward = forward === "ArrowLeft" ? "ArrowRight" : "ArrowLeft";
    const offsets: Record<string, number> = { [forward]: 1, [backward]: -1 };
    const offset = offsets[event.key];
    let next: number | undefined;
    if (offset !== undefined) {
      next = (index + offset + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = tabs.length - 1;
    }
    const tab = next === undefined ? undefined : tabs[next];
    if (next !== undefined && tab) {
      event.preventDefault();
      onSelect(tab.id);
      buttons.current[next]?.focus();
    }
  };

  return (
    <div className="flex flex-col gap-24">
      <div aria-label={label} className={`no-scrollbar overflow-x-auto ${look.list}`} role="tablist">
        {tabs.map((tab, index) => {
          const isSelected = tab.id === selected;
          return (
            <button
              aria-controls={`${baseId}-${tab.id}-panel`}
              aria-selected={isSelected}
              className={`flex shrink-0 cursor-pointer items-center gap-8 type-label-m focus-visible:outline-2 focus-visible:outline-brand ${look.tab} ${isSelected ? look.selected : look.idle}`}
              id={`${baseId}-${tab.id}-tab`}
              key={tab.id}
              onClick={() => onSelect(tab.id)}
              onKeyDown={(event) => move(event, index)}
              ref={(element) => {
                buttons.current[index] = element;
              }}
              role="tab"
              tabIndex={isSelected ? 0 : -1}
              type="button"
            >
              {tab.icon && <Icon name={tab.icon} size={16} />}
              {tab.label}
              {/* Keeps the label and the count apart in the tab's name. */}{" "}
              {tab.count !== undefined && (
                <bdi
                  className={`rounded-full px-8 type-label-s ${isSelected ? "bg-ink text-surface" : "bg-line text-ink-2"}`}
                  dir="ltr"
                >
                  {formatNumber(tab.count)}
                </bdi>
              )}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          aria-labelledby={`${baseId}-${tab.id}-tab`}
          hidden={tab.id !== selected}
          id={`${baseId}-${tab.id}-panel`}
          key={tab.id}
          role="tabpanel"
        >
          {tab.id === selected && tab.panel}
        </div>
      ))}
    </div>
  );
}
