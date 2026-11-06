import { useTranslation } from "react-i18next";
import { listingSorts } from "../../api";
import type { ListingSort } from "../../api";
import { chip, chipIdle } from "./chipStyles";

type SortSelectProps = {
  value: ListingSort;
  onChange: (sort: ListingSort) => void;
  // Shows "Sort by" before the choice; otherwise only screen readers hear it.
  showLabel?: boolean;
};

export function SortSelect({ value, onChange, showLabel = false }: SortSelectProps) {
  const { t } = useTranslation("listings");

  return (
    <label className={`${chip} ${chipIdle} gap-8`}>
      <span className={showLabel ? "type-label-s text-muted" : "sr-only"}>{t("explore.sort.label")}</span>
      <select
        className="cursor-pointer bg-transparent outline-none"
        onChange={(event) => {
          const sort = listingSorts.find((item) => item === event.target.value);
          if (sort) {
            onChange(sort);
          }
        }}
        value={value}
      >
        {listingSorts.map((sort) => (
          <option key={sort} value={sort}>
            {t(`explore.sort.${sort}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
