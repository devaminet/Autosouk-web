import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { Tabs } from "../../../components/Tabs";
import { TextField } from "../../../components/TextField";
import { formatNumber } from "../../../lib/format";
import { inspectionCategories, itemStatuses } from "../api";
import type { InspectionCategory, ItemStatus } from "../api";
import { isSectionDone, newItem } from "../reportForm";
import type { FormItem, ReportForm } from "../reportForm";

const statusLooks: Record<ItemStatus, string> = {
  pass: "has-checked:bg-success-soft has-checked:text-success has-checked:ring-success",
  attention: "has-checked:bg-warning-soft has-checked:text-warning has-checked:ring-warning",
  fail: "has-checked:bg-danger-soft has-checked:text-danger has-checked:ring-danger",
};

type ItemRowProps = {
  item: FormItem;
  onChange: (item: FormItem) => void;
  onRemove: () => void;
  problem?: "itemLabel" | "status";
  // Moves focus to a new item's name.
  focusName: boolean;
};

function ItemRow({ item, onChange, onRemove, problem, focusName }: ItemRowProps) {
  const { t } = useTranslation("inspections");
  const nameInput = useRef<HTMLInputElement>(null);
  const name = item.label.trim() || t("report.checklist.newItem");

  useEffect(() => {
    if (focusName) {
      nameInput.current?.focus();
    }
  }, [focusName]);

  return (
    <li className="grid grid-cols-1 items-center gap-12 border-b border-line py-16 md:grid-cols-12">
      <div className="md:col-span-4">
        {item.isCustom ? (
          <TextField
            dir="auto"
            error={problem === "itemLabel" ? t("report.errors.itemLabel") : undefined}
            hideLabel
            label={t("report.checklist.newItemLabel")}
            onChange={(event) => onChange({ ...item, label: event.target.value })}
            placeholder={t("report.checklist.newItem")}
            ref={nameInput}
            value={item.label}
          />
        ) : (
          <p className="type-label-m text-ink">{item.label}</p>
        )}
      </div>
      <TextField
        dir="auto"
        fieldClassName="md:col-span-4"
        hideLabel
        label={t("report.checklist.note", { item: name })}
        onChange={(event) => onChange({ ...item, note: event.target.value })}
        placeholder={t("report.checklist.notePlaceholder")}
        value={item.note}
      />
      <div className="flex items-center gap-8 md:col-span-4">
        <fieldset className="flex-1">
          <legend className="sr-only">{t("report.checklist.status", { item: name })}</legend>
          <div
            className={`flex gap-4 rounded-full bg-paper p-4 ring-1 ring-inset ${problem === "status" ? "ring-danger" : "ring-line"}`}
          >
            {itemStatuses.map((status) => (
              <label
                className={`flex min-h-control-s flex-1 cursor-pointer items-center justify-center rounded-full px-8 type-label-s text-muted ring-inset has-checked:ring-1 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand ${statusLooks[status]}`}
                key={status}
              >
                <input
                  checked={item.status === status}
                  className="sr-only"
                  name={`status-${item.id}`}
                  onChange={() => onChange({ ...item, status })}
                  type="radio"
                  value={status}
                />
                {t(`report.itemStatus.${status}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          aria-label={item.label.trim() ? t("report.checklist.remove", { item: name }) : t("report.checklist.removeNew")}
          className="flex size-control-s shrink-0 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-line hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          onClick={onRemove}
          type="button"
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </li>
  );
}

type ChecklistSectionProps = {
  sections: ReportForm["sections"];
  onChange: (category: InspectionCategory, items: FormItem[]) => void;
  selected: InspectionCategory;
  onSelect: (category: InspectionCategory) => void;
  problems: Record<string, "itemLabel" | "status">;
  // The item just added, which takes the focus.
  addedId: string | null;
  onAdd: (id: string) => void;
  progress: { rated: number; total: number };
};

// The items the mechanic checked, section by section, each with its result.
export function ChecklistSection({
  sections,
  onChange,
  selected,
  onSelect,
  problems,
  addedId,
  onAdd,
  progress,
}: ChecklistSectionProps) {
  const { t } = useTranslation("inspections");

  return (
    <section
      aria-labelledby="report-checklist"
      className="flex flex-col gap-20 rounded-2xl border border-line bg-surface p-20 md:p-32"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-8">
        <h2 className="type-h3 text-ink" id="report-checklist">
          {t("report.checklist.title")}
        </h2>
        <p className="type-mono-s text-muted">
          <bdi dir="ltr">
            {t("report.checklist.progress", { done: formatNumber(progress.rated), total: formatNumber(progress.total) })}
          </bdi>
        </p>
      </div>
      <Tabs
        appearance="pills"
        label={t("report.checklist.sections")}
        onSelect={onSelect}
        selected={selected}
        tabs={inspectionCategories.map((category) => {
          const items = sections[category];
          return {
            id: category,
            label: t(`report.categories.${category}`),
            icon: isSectionDone(items) ? "check-circle" : undefined,
            panel: (
              <div className="flex flex-col gap-16">
                {items.length === 0 ? (
                  <p className="type-body-s text-muted">{t("report.checklist.empty")}</p>
                ) : (
                  <ul className="flex flex-col border-t border-line">
                    {items.map((item) => (
                      <ItemRow
                        focusName={item.id === addedId}
                        item={item}
                        key={item.id}
                        onChange={(changed) =>
                          onChange(
                            category,
                            items.map((current) => (current.id === changed.id ? changed : current)),
                          )
                        }
                        onRemove={() => onChange(category, items.filter(({ id }) => id !== item.id))}
                        problem={problems[item.id]}
                      />
                    ))}
                  </ul>
                )}
                <Button
                  className="self-start"
                  onClick={() => {
                    const added = newItem();
                    onChange(category, [...items, added]);
                    onAdd(added.id);
                  }}
                  size="s"
                >
                  <Icon name="plus" size={16} />
                  {t("report.checklist.add")}
                </Button>
              </div>
            ),
          };
        })}
      />
    </section>
  );
}
