import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { TextField } from "../../../components/TextField";
import type { EquipmentCategory } from "../api";

const categoryIcons: Record<string, IconName> = {
  safety: "shield",
  driving_assistance: "navigation",
  comfort: "armchair",
  multimedia: "music",
  exterior: "car",
};

type EquipmentPickerProps = {
  categories: EquipmentCategory[];
  selected: number[];
  onChange: (selected: number[]) => void;
  error?: string;
};

// Equipment grouped by category. Closed groups list what is ticked in them.
export function EquipmentPicker({ categories, selected, onChange, error }: EquipmentPickerProps) {
  const { t } = useTranslation(["listings", "enums"]);
  const id = useId();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string[]>([]);
  const query = search.trim().toLocaleLowerCase();
  const allOpen = open.length === categories.length;

  const label = (slug: string, name: string) => t(`enums:equipment.${slug}`, { defaultValue: name });

  const toggle = (equipmentId: number) => {
    onChange(
      selected.includes(equipmentId)
        ? selected.filter((item) => item !== equipmentId)
        : [...selected, equipmentId],
    );
  };

  const groups = categories
    .map((category) => ({
      category,
      matches: category.equipment.filter(({ slug, name }) =>
        label(slug, name).toLocaleLowerCase().includes(query),
      ),
    }))
    .filter(({ matches }) => matches.length > 0);

  return (
    <div className="flex flex-col gap-16">
      <div className="flex items-end gap-12">
        <TextField
          fieldClassName="flex-1"
          icon="search"
          label={t("equipment.search")}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("equipment.searchPlaceholder")}
          type="search"
          value={search}
        />
        <button
          className="hidden min-h-48 cursor-pointer rounded-sm px-8 type-label-s text-ink hover:underline focus-visible:outline-2 focus-visible:outline-brand md:block"
          onClick={() => setOpen(allOpen ? [] : categories.map(({ slug }) => slug))}
          type="button"
        >
          {allOpen ? t("equipment.collapseAll") : t("equipment.expandAll")}
        </button>
      </div>
      {error && <p className="type-body-xs text-danger">{error}</p>}
      {groups.length === 0 && (
        <p className="py-16 type-body-s text-muted">{t("equipment.noMatch", { query: search.trim() })}</p>
      )}
      <ul className="flex flex-col">
        {groups.map(({ category, matches }) => {
          const isOpen = query !== "" || open.includes(category.slug);
          const ticked = category.equipment.filter((item) => selected.includes(item.id));
          const panelId = `${id}-${category.slug}`;
          return (
            <li className="flex flex-col gap-12 border-b border-line py-16 last:border-b-0" key={category.id}>
              <button
                aria-controls={panelId}
                aria-expanded={isOpen}
                className="flex cursor-pointer items-center gap-12 rounded-sm text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-default"
                disabled={query !== ""}
                onClick={() =>
                  setOpen((current) =>
                    current.includes(category.slug)
                      ? current.filter((slug) => slug !== category.slug)
                      : [...current, category.slug],
                  )
                }
                type="button"
              >
                <span className="flex size-control-s shrink-0 items-center justify-center rounded-md bg-paper text-ink">
                  <Icon name={categoryIcons[category.slug] ?? "grid"} size={16} />
                </span>
                <span className="flex-1 type-h5 text-ink">
                  {t(`enums:equipment_category.${category.slug}`, { defaultValue: category.name })}
                </span>
                <span className="rounded-full bg-brand-soft px-8 type-label-s text-brand-ink">
                  {t("equipment.count", { selected: ticked.length, total: category.equipment.length })}
                </span>
                <Icon
                  className={isOpen ? "rotate-180" : ""}
                  name="chevron-down"
                  size={18}
                />
              </button>
              <div id={panelId}>
                {isOpen ? (
                  <ul className="flex flex-wrap gap-8">
                    {matches.map((item) => (
                      <li key={item.id}>
                        <label className="group flex min-h-control-s cursor-pointer items-center gap-4 rounded-full bg-surface px-12 type-label-m text-ink ring-1 ring-line-strong ring-inset has-checked:bg-brand-soft has-checked:text-brand-ink has-checked:ring-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand">
                          <input
                            checked={selected.includes(item.id)}
                            className="sr-only"
                            onChange={() => toggle(item.id)}
                            type="checkbox"
                          />
                          <Icon className="group-has-checked:hidden" name="plus" size={14} />
                          <Icon className="hidden group-has-checked:block" name="check" size={14} />
                          {label(item.slug, item.name)}
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  ticked.length > 0 && (
                    <p className="truncate ps-48 type-body-s text-muted">
                      {ticked.map((item) => label(item.slug, item.name)).join(" · ")}
                    </p>
                  )
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
