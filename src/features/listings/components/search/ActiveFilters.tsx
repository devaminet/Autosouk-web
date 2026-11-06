import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../../../components/Icon";
import { chip, chipIdle } from "./chipStyles";

export type ActiveFilter = {
  id: string;
  label: ReactNode;
  // The label as plain text, for the remove button's name.
  name: string;
  onRemove: () => void;
};

type ActiveFiltersProps = {
  filters: ActiveFilter[];
  onClearAll: () => void;
};

// The filters in use, each removable on its own.
export function ActiveFilters({ filters, onClearAll }: ActiveFiltersProps) {
  const { t } = useTranslation("listings");

  return (
    <div className="flex flex-wrap items-center gap-8">
      <ul aria-label={t("search.active.label")} className="flex flex-wrap gap-8">
        {filters.map((filter) => (
          <li key={filter.id}>
            <button
              aria-label={t("search.active.remove", { name: filter.name })}
              className={`${chip} ${chipIdle} gap-8`}
              onClick={filter.onRemove}
              type="button"
            >
              <span dir="auto">{filter.label}</span>
              <Icon className="text-muted" name="x" size={14} />
            </button>
          </li>
        ))}
      </ul>
      <button
        className="min-h-control-s cursor-pointer rounded-xs px-8 type-label-s text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        onClick={onClearAll}
        type="button"
      >
        {t("search.active.clearAll")}
      </button>
    </div>
  );
}
