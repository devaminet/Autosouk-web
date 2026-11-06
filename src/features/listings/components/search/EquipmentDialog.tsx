import { useId } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../../components/Button";
import { Icon } from "../../../../components/Icon";
import { useModalDialog } from "../../../../hooks/useModalDialog";
import type { EquipmentCategory } from "../../api";
import { EquipmentPicker } from "../EquipmentPicker";

type EquipmentDialogProps = {
  open: boolean;
  onClose: () => void;
  categories: EquipmentCategory[];
  selected: number[];
  onChange: (selected: number[]) => void;
  // Applies every filter, with the number of cars it finds.
  onApply: () => void;
  applyLabel: ReactNode;
};

// Every equipment item, to filter by. Full screen on small screens, a modal on wide ones.
export function EquipmentDialog({
  open,
  onClose,
  categories,
  selected,
  onChange,
  onApply,
  applyLabel,
}: EquipmentDialogProps) {
  const { t } = useTranslation(["listings", "enums"]);
  const dialog = useModalDialog(open);
  const titleId = useId();
  const items = categories.flatMap(({ equipment }) => equipment);
  const picked = items.filter(({ id }) => selected.includes(id));

  return (
    <dialog
      aria-labelledby={titleId}
      className="m-0 h-dvh max-h-dvh w-full max-w-none bg-paper text-ink shadow-overlay backdrop:bg-night/50 open:flex open:flex-col md:m-auto md:h-auto md:max-w-auth-wide md:rounded-2xl"
      onClose={onClose}
      ref={dialog}
    >
      {open && (
        <>
          <header className="flex items-center gap-12 px-20 py-16">
            <button
              aria-label={t("search.equipment.back")}
              className="flex size-40 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface text-ink ring-1 ring-line ring-inset hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              onClick={onClose}
              type="button"
            >
              <Icon name="arrow-left" size={18} />
            </button>
            <h2 className="flex-1 text-center type-h5 text-ink" id={titleId}>
              {t("search.equipment.title")}
            </h2>
            <span aria-hidden="true" className="size-40 shrink-0" />
          </header>
          <div className="flex flex-1 flex-col gap-16 overflow-y-auto px-20 pb-24">
            <p className="type-body-s text-muted">{t("search.equipment.hint")}</p>
            {picked.length > 0 && (
              <ul aria-label={t("search.equipment.selected")} className="flex flex-wrap gap-8">
                {picked.map((item) => {
                  const name = t(`enums:equipment.${item.slug}`, { defaultValue: item.name });
                  return (
                    <li key={item.id}>
                      <button
                        aria-label={t("search.active.remove", { name })}
                        className="flex min-h-control-s cursor-pointer items-center gap-8 rounded-full bg-ink px-16 type-label-m text-surface hover:bg-ink-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                        onClick={() => onChange(selected.filter((id) => id !== item.id))}
                        type="button"
                      >
                        {name}
                        <Icon name="x" size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <EquipmentPicker categories={categories} onChange={onChange} selected={selected} />
          </div>
          <footer className="flex items-center gap-12 border-t border-line bg-surface px-20 py-16">
            <Button disabled={selected.length === 0} onClick={() => onChange([])} variant="ghost">
              {t("search.equipment.clear")}
            </Button>
            <Button block className="flex-1" onClick={onApply} size="l" variant="dark">
              {applyLabel}
            </Button>
          </footer>
        </>
      )}
    </dialog>
  );
}
