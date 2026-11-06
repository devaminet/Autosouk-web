import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import type { ListingCar } from "../api";

// Per category, until the buyer asks for everything.
const shownPerCategory = 6;

type ListingEquipmentProps = {
  equipment: ListingCar["equipment"];
};

// The car's equipment by category, in catalog order.
export function ListingEquipment({ equipment }: ListingEquipmentProps) {
  const { t } = useTranslation(["listings", "enums"]);
  const [showAll, setShowAll] = useState(false);
  const listId = useId();
  const categories: { slug: string; name: string; items: ListingCar["equipment"] }[] = [];
  for (const item of equipment) {
    const category = categories.find(({ slug }) => slug === item.category.slug);
    if (category) {
      category.items.push(item);
    } else {
      categories.push({ ...item.category, items: [item] });
    }
  }
  const hasMore = categories.some(({ items }) => items.length > shownPerCategory);

  if (equipment.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-20 rounded-xl border border-line bg-surface p-20 md:p-24">
      <div className="flex flex-wrap items-baseline justify-between gap-8">
        <h2 className="type-h4 text-ink">{t("equipment.title")}</h2>
        <p className="type-body-xs text-muted">{t("listing.equipmentCount", { count: equipment.length })}</p>
      </div>
      <div className="flex flex-col gap-20" id={listId}>
        {categories.map(({ slug, name, items }) => {
          const hidden = showAll ? 0 : items.length - shownPerCategory;
          return (
            <section className="flex flex-col gap-12 border-b border-line pb-20 last:border-b-0 last:pb-0" key={slug}>
              <div className="flex items-center justify-between gap-8">
                <h3 className="type-label-l text-ink">
                  {t(`enums:equipment_category.${slug}`, { defaultValue: name })}
                </h3>
                <span className="type-mono-s text-muted">
                  <bdi dir="ltr">{items.length}</bdi>
                </span>
              </div>
              <ul className="grid grid-cols-1 gap-x-16 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {(showAll ? items : items.slice(0, shownPerCategory)).map((item) => (
                  <li className="flex items-center gap-8 type-body-s text-ink" key={item.id}>
                    <Icon className="text-success" name="check-circle" size={16} />
                    {t(`enums:equipment.${item.slug}`, { defaultValue: item.name })}
                  </li>
                ))}
              </ul>
              {hidden > 0 && (
                <p className="type-label-s text-brand">{t("listing.moreEquipment", { count: hidden })}</p>
              )}
            </section>
          );
        })}
      </div>
      {hasMore && (
        <button
          aria-controls={listId}
          aria-expanded={showAll}
          className="flex min-h-control-s w-fit cursor-pointer items-center gap-4 rounded-full px-12 type-label-m text-ink ring-1 ring-line-strong ring-inset hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          onClick={() => setShowAll((value) => !value)}
          type="button"
        >
          <Icon className={showAll ? "rotate-180" : ""} name="chevron-down" size={16} />
          {showAll ? t("listing.showFewer") : t("listing.showAllEquipment", { count: equipment.length })}
        </button>
      )}
    </section>
  );
}
