import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Button } from "../../../../components/Button";
import { Icon } from "../../../../components/Icon";
import { SelectField } from "../../../../components/SelectField";
import { TextField } from "../../../../components/TextField";
import { useDebouncedValue } from "../../../../hooks/useDebouncedValue";
import { formatNumber } from "../../../../lib/format";
import type { EquipmentCategory } from "../../api";
import { useFuelCounts, useLookups, useMakes, useModels, usePriceHistogram, usePublicListings } from "../../hooks";
import { toListingsFilter } from "../../listingSearch";
import type { ListingSearch } from "../../listingSearch";
import { EquipmentDialog } from "./EquipmentDialog";
import { FuelFilter } from "./FuelFilter";
import { PriceRange } from "./PriceRange";
import { TransmissionFilter } from "./TransmissionFilter";

// Common equipment offered as one-tap filters, when the catalog has them.
const suggestedEquipment = [
  "apple_carplay",
  "rear_camera",
  "automatic_climate_control",
  "cruise_control",
  "leather_seats",
  "panoramic_roof",
  "keyless_entry",
  "alloy_wheels",
];

type Filters = Omit<ListingSearch, "sort" | "page">;

type SearchFiltersProps = {
  search: ListingSearch;
  onApply: (filters: Filters) => void;
  categories: EquipmentCategory[];
  // The mobile sheet lists the chosen equipment on one row instead of as chips.
  compact?: boolean;
  onClose?: () => void;
};

const optional = (value: string): number | undefined => (value === "" ? undefined : Number(value));

// Ignores spaces and separators, so "80 000" reads as 80000.
const price = (value: string): number | undefined => {
  const number = Number.parseInt(value.replaceAll(/\D/gu, ""), 10);
  return Number.isNaN(number) || number <= 0 ? undefined : number;
};

// Every filter the API supports. Changes apply together, with the number of
// cars they find on the button. Remount it when the search changes.
export function SearchFilters({ search, onApply, categories, compact = false, onClose }: SearchFiltersProps) {
  const { t, i18n } = useTranslation(["listings", "enums"]);
  const titleId = useId();
  const [makeId, setMakeId] = useState(search.makeId?.toString() ?? "");
  const [modelId, setModelId] = useState(search.modelId?.toString() ?? "");
  const [cityId, setCityId] = useState(search.cityId?.toString() ?? "");
  const [minPrice, setMinPrice] = useState(search.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(search.maxPrice?.toString() ?? "");
  const [equipmentIds, setEquipmentIds] = useState(search.equipmentIds);
  const [transmission, setTransmission] = useState(search.transmission);
  const [carburantIds, setCarburantIds] = useState(search.carburantIds);
  const [browsing, setBrowsing] = useState(false);
  const [showPriceError, setShowPriceError] = useState(false);
  const makes = useMakes();
  const models = useModels(makeId === "" ? null : Number(makeId));
  const lookups = useLookups();

  const filters: Filters = {
    makeId: optional(makeId),
    modelId: optional(modelId),
    cityId: optional(cityId),
    minPrice: price(minPrice),
    maxPrice: price(maxPrice),
    equipmentIds,
    transmission,
    carburantIds,
  };
  const priceOrderWrong =
    filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice;

  // Counts what the filters would find, once the prices stop changing.
  const previewMin = useDebouncedValue(minPrice, 300);
  const previewMax = useDebouncedValue(maxPrice, 300);
  const preview = usePublicListings(
    toListingsFilter({ ...filters, minPrice: price(previewMin), maxPrice: price(previewMax), sort: "newest", page: 1 }, 1),
  );
  // How prices spread for the other filters. The sheet has no room for it.
  const histogram = usePriceHistogram(
    {
      makeId: filters.makeId,
      modelId: filters.modelId,
      cityId: filters.cityId,
      equipmentIds: equipmentIds.length > 0 ? equipmentIds : undefined,
      transmission,
      carburantIds: carburantIds.length > 0 ? carburantIds : undefined,
      sort: "newest",
    },
    !compact,
  );
  // How many cars each fuel would find, with the other filters.
  const fuels = lookups.data?.carburants ?? [];
  const fuelCounts = useFuelCounts(
    toListingsFilter({ ...filters, minPrice: price(previewMin), maxPrice: price(previewMax), sort: "newest", page: 1 }, 1),
    fuels.map(({ id }) => id),
  );
  const total = preview.data?.meta.total;
  const applyLabel =
    total === undefined ? (
      t("search.filters.showAny")
    ) : (
      // One span, so the button's gap doesn't split the sentence.
      <span>
        <Trans
          components={{ n: <bdi dir="ltr" /> }}
          count={total}
          i18nKey="search.filters.show"
          ns="listings"
          values={{ formatted: formatNumber(total) }}
        />
      </span>
    );

  const cities = (lookups.data?.cities ?? [])
    .map(({ id, slug, name }) => ({ id, label: t(`enums:city.${slug}`, { defaultValue: name }) }))
    .sort((a, b) => a.label.localeCompare(b.label, i18n.language));
  const items = categories.flatMap(({ equipment }) => equipment);
  const label = (item: { slug: string; name: string }) =>
    t(`enums:equipment.${item.slug}`, { defaultValue: item.name });
  const picked = items.filter(({ id }) => equipmentIds.includes(id));
  // The chosen items first, then the suggestions.
  const chips = [
    ...picked,
    ...items.filter(({ id, slug }) => suggestedEquipment.includes(slug) && !equipmentIds.includes(id)),
  ];

  const toggle = (id: number) =>
    setEquipmentIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const apply = () => {
    if (priceOrderWrong) {
      setShowPriceError(true);
      setBrowsing(false);
      return;
    }
    setBrowsing(false);
    onApply(filters);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    apply();
  };

  const reset = () => {
    setMakeId("");
    setModelId("");
    setCityId("");
    setMinPrice("");
    setMaxPrice("");
    setEquipmentIds([]);
    setTransmission(undefined);
    setCarburantIds([]);
    setShowPriceError(false);
  };

  return (
    <>
      <form aria-labelledby={titleId} className="flex flex-col gap-24" noValidate onSubmit={submit}>
        <div className="flex items-center justify-between gap-12">
          <h2 className="flex items-center gap-8 type-h4 text-ink" id={titleId}>
            <Icon name="sliders" size={20} />
            {t("search.filters.title")}
          </h2>
          <div className="flex items-center gap-4">
            <button
              className="min-h-control-s cursor-pointer rounded-xs px-8 type-label-m text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              onClick={reset}
              type="button"
            >
              {t("search.filters.reset")}
            </button>
            {onClose && (
              <button
                aria-label={t("search.filters.close")}
                className="flex size-40 cursor-pointer items-center justify-center rounded-full text-ink hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                onClick={onClose}
                type="button"
              >
                <Icon name="x" size={18} />
              </button>
            )}
          </div>
        </div>
        <div className={`grid gap-16 ${compact ? "grid-cols-2" : ""}`}>
          <SelectField
            label={t("explore.search.make")}
            onChange={(event) => {
              setMakeId(event.target.value);
              setModelId("");
            }}
            value={makeId}
          >
            <option value="">{t("explore.search.anyMake")}</option>
            {makes.data?.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </SelectField>
          <SelectField
            disabled={makeId === ""}
            label={t("explore.search.model")}
            onChange={(event) => setModelId(event.target.value)}
            value={modelId}
          >
            <option value="">{t("explore.search.anyModel")}</option>
            {models.data?.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </SelectField>
          <SelectField
            fieldClassName={compact ? "col-span-2" : ""}
            icon="map-pin"
            label={t("explore.search.city")}
            onChange={(event) => setCityId(event.target.value)}
            value={cityId}
          >
            <option value="">{t("explore.search.anyCity")}</option>
            {cities.map(({ id, label: name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </SelectField>
        </div>
        <PriceRange
          counts={histogram}
          maxPrice={filters.maxPrice}
          minPrice={filters.minPrice}
          onChange={(min, max) => {
            setMinPrice(min?.toString() ?? "");
            setMaxPrice(max?.toString() ?? "");
          }}
          showHistogram={!compact}
        >
          {/* Side by side as in the design, one per row on small screens. */}
          <div className="grid gap-12 sm:grid-cols-2">
            <TextField
              dir="ltr"
              hideLabel
              inputMode="numeric"
              label={t("search.filters.minPrice")}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder={t("search.filters.noMin")}
              trailing={<span className="type-mono-s text-muted">{t("units.mad")}</span>}
              value={minPrice}
            />
            <TextField
              dir="ltr"
              error={showPriceError && priceOrderWrong ? t("search.filters.priceOrder") : undefined}
              hideLabel
              inputMode="numeric"
              label={t("search.filters.maxPrice")}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder={t("explore.search.noLimit")}
              trailing={<span className="type-mono-s text-muted">{t("units.mad")}</span>}
              value={maxPrice}
            />
          </div>
        </PriceRange>
        <TransmissionFilter onChange={setTransmission} value={transmission} />
        {fuels.length > 0 && (
          <FuelFilter counts={fuelCounts} fuels={fuels} onChange={setCarburantIds} selected={carburantIds} />
        )}
        {compact ? (
          <button
            className="flex cursor-pointer items-center gap-12 rounded-lg bg-surface p-16 text-start ring-1 ring-line ring-inset hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            onClick={() => setBrowsing(true)}
            type="button"
          >
            <Icon name="check-circle" size={20} />
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="type-label-l text-ink">{t("search.filters.equipment")}</span>
              <span className="truncate type-body-xs text-muted">
                {picked.length > 0 ? picked.map(label).join(" · ") : t("search.filters.anyEquipment")}
              </span>
            </span>
            {picked.length > 0 && (
              <span className="rounded-full bg-brand-soft px-8 type-label-s text-brand-ink">
                <bdi dir="ltr">{picked.length}</bdi>
              </span>
            )}
            <Icon name="chevron-right" size={18} />
          </button>
        ) : (
          <fieldset className="flex flex-col gap-12">
            <div className="flex items-baseline justify-between gap-8">
              <legend className="type-label-m text-ink">{t("search.filters.equipment")}</legend>
              <span className="type-body-xs text-muted">{t("search.filters.mustHaveAll")}</span>
            </div>
            {chips.length > 0 && (
              <ul className="flex flex-wrap gap-8">
                {chips.map((item) => (
                  <li key={item.id}>
                    <label className="group flex min-h-control-s cursor-pointer items-center gap-4 rounded-full bg-surface px-12 type-label-m text-ink ring-1 ring-line-strong ring-inset has-checked:bg-brand-soft has-checked:text-brand-ink has-checked:ring-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand">
                      <input
                        checked={equipmentIds.includes(item.id)}
                        className="sr-only"
                        onChange={() => toggle(item.id)}
                        type="checkbox"
                      />
                      <Icon className="group-has-checked:hidden" name="plus" size={14} />
                      <Icon className="hidden group-has-checked:block" name="check" size={14} />
                      {label(item)}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {items.length > 0 && (
              <button
                className="flex w-fit cursor-pointer items-center gap-4 rounded-xs type-label-s text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                onClick={() => setBrowsing(true)}
                type="button"
              >
                {t("search.filters.browse", { count: items.length, formatted: formatNumber(items.length) })}
                <Icon name="chevron-right" size={14} />
              </button>
            )}
          </fieldset>
        )}
        <Button block size="l" type="submit" variant="dark">
          {applyLabel}
        </Button>
      </form>
      <EquipmentDialog
        applyLabel={applyLabel}
        categories={categories}
        onApply={apply}
        onChange={setEquipmentIds}
        onClose={() => setBrowsing(false)}
        open={browsing}
        selected={equipmentIds}
      />
    </>
  );
}
