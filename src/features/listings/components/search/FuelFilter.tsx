import { useTranslation } from "react-i18next";
import { Icon } from "../../../../components/Icon";
import { formatNumber } from "../../../../lib/format";

type Fuel = { id: number; slug: string };

type FuelFilterProps = {
  fuels: Fuel[];
  selected: number[];
  onChange: (selected: number[]) => void;
  // How many cars each fuel would find, by fuel id, once known.
  counts: Map<number, number | undefined>;
};

// Fuels to pick from, with how many cars each would find. A car with any of
// the chosen fuels matches.
export function FuelFilter({ fuels, selected, onChange, counts }: FuelFilterProps) {
  const { t } = useTranslation(["listings", "enums"]);
  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="pb-8 type-label-m text-ink">{t("search.filters.fuel")}</legend>
      {fuels.map(({ id, slug }) => {
        const count = counts.get(id);
        return (
          <label className="group flex min-h-control-s cursor-pointer items-center gap-12 rounded-xs" key={id}>
            <input checked={selected.includes(id)} className="peer sr-only" onChange={() => toggle(id)} type="checkbox" />
            <span className="flex size-20 shrink-0 items-center justify-center rounded-xs bg-surface text-on-brand ring-1 ring-line-strong ring-inset peer-checked:bg-brand peer-checked:ring-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
              <Icon className="hidden group-has-checked:block" name="check" size={14} />
            </span>
            <span className="flex-1 type-body-m text-ink">{t(`enums:carburant.${slug}`, { defaultValue: slug })}</span>
            {/* Keeps the name and the count apart in the checkbox's name. */}{" "}
            {count !== undefined && (
              <span className="type-mono-s text-muted">
                <bdi dir="ltr" aria-hidden="true">
                  {formatNumber(count)}
                </bdi>
                <span className="sr-only">
                  {t("search.filters.fuelCount", { count, formatted: formatNumber(count) })}
                </span>
              </span>
            )}
          </label>
        );
      })}
    </fieldset>
  );
}
