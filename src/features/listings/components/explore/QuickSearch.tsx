import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../../../components/Icon";
import type { ExploreSearch } from "../../exploreSearch";
import { useLookups, useMakes, useModels } from "../../hooks";

type QuickSearchProps = {
  search: ExploreSearch;
  onSearch: (changes: Partial<ExploreSearch>) => void;
};

type CellProps = {
  label: string;
  htmlFor: string;
  children: ReactNode;
};

const control =
  "w-full min-w-0 cursor-pointer bg-transparent type-label-m text-ink outline-none disabled:cursor-not-allowed disabled:text-muted";

function Cell({ label, htmlFor, children }: CellProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg px-16 py-8 focus-within:bg-paper">
      <label className="type-overline text-muted" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

const optional = (value: string): number | undefined => (value === "" ? undefined : Number(value));

// The hero's search. It starts from the address, so remount it when that changes.
export function QuickSearch({ search, onSearch }: QuickSearchProps) {
  const { t, i18n } = useTranslation(["listings", "enums"]);
  const [makeId, setMakeId] = useState(search.makeId?.toString() ?? "");
  const [modelId, setModelId] = useState(search.modelId?.toString() ?? "");
  const [cityId, setCityId] = useState(search.cityId?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(search.maxPrice?.toString() ?? "");
  const makes = useMakes();
  const models = useModels(makeId === "" ? null : Number(makeId));
  const lookups = useLookups();
  const cities = (lookups.data?.cities ?? [])
    .map(({ id, slug, name }) => ({ id, label: t(`enums:city.${slug}`, { defaultValue: name }) }))
    .sort((a, b) => a.label.localeCompare(b.label, i18n.language));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const price = Number.parseInt(maxPrice.replaceAll(/\D/gu, ""), 10);
    onSearch({
      makeId: optional(makeId),
      modelId: optional(modelId),
      cityId: optional(cityId),
      maxPrice: Number.isNaN(price) || price <= 0 ? undefined : price,
    });
  };

  return (
    <search aria-label={t("explore.search.label")}>
      <form
        className="flex flex-col gap-8 rounded-2xl bg-surface p-8 shadow-elevation-2 lg:flex-row lg:items-center"
        onSubmit={submit}
      >
      <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Cell htmlFor="explore-make" label={t("explore.search.make")}>
          <select
            className={control}
            id="explore-make"
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
          </select>
        </Cell>
        <Cell htmlFor="explore-model" label={t("explore.search.model")}>
          <select
            className={control}
            disabled={makeId === ""}
            id="explore-model"
            onChange={(event) => setModelId(event.target.value)}
            value={modelId}
          >
            <option value="">{t("explore.search.anyModel")}</option>
            {models.data?.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </Cell>
        <Cell htmlFor="explore-city" label={t("explore.search.city")}>
          <select className={control} id="explore-city" onChange={(event) => setCityId(event.target.value)} value={cityId}>
            <option value="">{t("explore.search.anyCity")}</option>
            {cities.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </Cell>
        <Cell htmlFor="explore-price" label={t("explore.search.maxPrice")}>
          <span className="flex items-baseline gap-4">
            <input
              className={`${control} cursor-text placeholder:text-muted`}
              dir="ltr"
              id="explore-price"
              inputMode="numeric"
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder={t("explore.search.noLimit")}
              value={maxPrice}
            />
            <span className="type-mono-s text-muted">{t("units.mad")}</span>
          </span>
        </Cell>
      </div>
      <button
        className="flex min-h-control-l cursor-pointer items-center justify-center gap-8 rounded-full bg-brand px-24 type-label-l text-on-brand shadow-elevation-brand hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:size-control-l lg:px-0"
        type="submit"
      >
        <Icon name="search" size={20} />
        <span className="lg:sr-only">{t("explore.search.submit")}</span>
      </button>
      </form>
    </search>
  );
}
