import { useTranslation } from "react-i18next";
import carImage from "../../../../assets/car.svg";
import { formatNumber } from "../../../../lib/format";
import type { ListingSearch } from "../../listingSearch";
import { useMakes } from "../../hooks";
import { QuickSearch } from "./QuickSearch";

// Matched by name, as make ids differ between databases.
const popularMakes = ["DACIA", "RENAULT", "PEUGEOT", "VOLKSWAGEN", "TOYOTA"];

type ExploreHeroProps = {
  search: ListingSearch;
  onSearch: (changes: Partial<ListingSearch>) => void;
  // How many approved listings there are, once known.
  total?: number;
  firstName?: string;
};

// A night panel on wide screens; on small ones it sits on the page itself.
export function ExploreHero({ search, onSearch, total, firstName }: ExploreHeroProps) {
  const { t } = useTranslation("listings");
  const makes = useMakes();
  const popular = popularMakes.flatMap((name) => {
    const make = makes.data?.find((item) => item.name.toUpperCase() === name);
    return make ? [make] : [];
  });

  return (
    <section
      aria-labelledby="explore-title"
      className="flex flex-col gap-24 px-20 pt-24 md:mx-24 md:mt-24 md:flex-row md:items-center md:gap-48 md:rounded-2xl md:bg-night md:bg-zellige md:px-48 md:py-64 lg:px-64"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-24">
        <div className="flex flex-col gap-16">
          {firstName && <p className="type-body-m text-muted md:text-subtle">{t("explore.hero.greeting", { name: firstName })}</p>}
          {total !== undefined && total > 0 && (
            <p className="hidden w-fit items-center gap-4 rounded-full bg-saffron-soft px-8 py-4 type-label-s text-warning md:flex">
              <span aria-hidden="true" className="size-4 rounded-full bg-current" />
              {t("explore.hero.count", { count: total, formatted: formatNumber(total) })}
            </p>
          )}
          <h1 className="type-h1 text-ink md:type-display-l md:text-surface xl:type-display-xl" id="explore-title">
            {t("explore.hero.titleStart")} <span className="text-brand md:text-saffron">{t("explore.hero.titleEnd")}</span>
          </h1>
          <p className="hidden max-w-xl type-body-l text-subtle md:block">{t("explore.hero.description")}</p>
        </div>
        <QuickSearch key={JSON.stringify(search)} onSearch={onSearch} search={search} />
        {popular.length > 0 && (
          <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
            <p className="shrink-0 type-label-m text-muted md:text-subtle">{t("explore.hero.popular")}</p>
            <ul className="flex gap-8">
              {popular.map(({ id, name }) => (
                <li key={id}>
                  <button
                    aria-pressed={search.makeId === id}
                    className="min-h-control-s cursor-pointer rounded-full bg-surface px-12 type-label-s whitespace-nowrap text-ink ring-1 ring-line ring-inset hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand aria-pressed:bg-ink aria-pressed:text-surface md:bg-night-2 md:text-surface md:ring-0 md:hover:bg-ink-2 md:aria-pressed:bg-surface md:aria-pressed:text-ink"
                    onClick={() => onSearch({ makeId: id, modelId: undefined })}
                    type="button"
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div
        aria-hidden="true"
        className="hidden aspect-4/3 w-2/5 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-brand to-brand-ink px-48 shadow-elevation-2 lg:flex"
      >
        <img alt="" className="w-full" src={carImage} />
      </div>
    </section>
  );
}
