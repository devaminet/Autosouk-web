import { lazy, Suspense, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { PageTitle } from "../../../components/PageTitle";
import { Pagination } from "../../../components/Pagination";
import { SelectField } from "../../../components/SelectField";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { formatNumber } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import { directionOf } from "../../../lib/locale";
import { partnerSignupPath, paths } from "../../../lib/paths";
import { useCityOptions, useSession } from "../../auth/hooks";
import { rankingsPageSize } from "../api";
import type { RankedGarage } from "../api";
import { ChampionRow } from "../components/ChampionRow";
import { RankingRow } from "../components/RankingRow";
import { TopGarages } from "../components/TopGarages";
import type { CityChoice } from "../geo";
import { useRankings } from "../hooks";

// Leaflet is large, so only wide screens download it, on this page.
const GaragesMap = lazy(async () => ({ default: (await import("../components/GaragesMap")).GaragesMap }));

// Tailwind's lg breakpoint, where the map joins the list.
const wideScreen = "(min-width: 64rem)";

const positiveInt = (value: string | null) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};

const radiusOf = (city: CityChoice) => city.area?.radiusKm ?? 0;

// The city in the address, else the visitor's own, else the largest one.
const chooseCity = (cities: CityChoice[], asked: number | null, own: number | null | undefined) =>
  cities.find(({ id }) => id === asked) ??
  cities.find(({ id }) => id === own) ??
  cities.reduce<CityChoice | undefined>(
    (largest, city) => (largest && radiusOf(largest) >= radiusOf(city) ? largest : city),
    undefined,
  ) ??
  null;

// The garages of a city, best rated first, with their prices on a map.
export function MechanicsPage() {
  const { t } = useTranslation(["mechanics", "listings"]);
  const [params, setParams] = useSearchParams();
  const { user } = useSession();
  const cities = useCityOptions();
  const city = chooseCity(cities.options, positiveInt(params.get("city")), user?.cityId);
  const page = positiveInt(params.get("page")) ?? 1;
  const rankings = useRankings(city?.id ?? null, page);
  const isWide = useMediaQuery(wideScreen);

  const garages = rankings.data?.rankings;
  const firstRank = (page - 1) * rankingsPageSize + 1;
  const mapGarages = useMemo(
    () =>
      (garages ?? []).map((garage, index) => ({
        id: garage.mechanicId,
        name: garage.name,
        lat: garage.latitude,
        lng: garage.longitude,
        price:
          garage.inspectionPrice === null
            ? t("rankings.priceAtGarage")
            : `${formatNumber(garage.inspectionPrice)} ${t("listings:units.mad")}`,
        isTop: firstRank + index === 1,
      })),
    [garages, firstRank, t],
  );

  const pageHref = (nextPage: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(nextPage));
    return `?${next.toString()}`;
  };

  const changeCity = (cityId: string) => setParams({ city: cityId }, { preventScrollReset: true });

  const partnerAction = () => {
    if (!user) {
      return (
        <ButtonLink size="l" to={partnerSignupPath}>
          <Icon name="wrench" size={18} />
          {t("rankings.becomePartner")}
        </ButtonLink>
      );
    }
    if (user.role === "mechanic") {
      return (
        <ButtonLink size="l" to={paths.workshop}>
          <Icon name="wrench" size={18} />
          {t("rankings.myWorkshop")}
        </ButtonLink>
      );
    }
    return null;
  };

  const list = (items: RankedGarage[]) => {
    const cityName = city?.label ?? "";
    // The podium shows the first three on wide screens, and the banner the first on small ones.
    const onPodium = (rank: number) => page === 1 && rank <= 3;
    // Then the list has no row left on wide screens, so its card would stand empty.
    const allOnPodium = items.every((_, index) => onPodium(firstRank + index));
    return (
      <>
        {page === 1 && items.length > 0 && (
          <div className="hidden md:block">
            <TopGarages garages={items.slice(0, 3)} />
          </div>
        )}
        <ol
          aria-label={t("rankings.listLabel", { city: cityName })}
          className={`flex flex-col gap-12 rounded-2xl md:gap-0 md:border md:border-line md:bg-surface md:px-24 md:py-8 ${allOnPodium ? "md:hidden" : ""}`}
        >
          {items.map((garage, index) => {
            const rank = firstRank + index;
            return (
              <li
                className={`border-b border-line last:border-b-0 ${onPodium(rank) ? "md:hidden" : ""} ${rank === 1 ? "border-b-0" : ""}`}
                key={garage.mechanicId}
              >
                {rank === 1 ? (
                  <ChampionRow garage={garage} />
                ) : (
                  <RankingRow city={cityName} garage={garage} rank={rank} />
                )}
              </li>
            );
          })}
        </ol>
      </>
    );
  };

  const body = () => {
    if (cities.isError || rankings.isError) {
      return (
        <div className="flex flex-col items-start gap-16" role="alert">
          <Alert tone="danger">{rankings.error?.message ?? t("common:errors.unexpected")}</Alert>
          <Button onClick={() => void (cities.isError ? cities.retry() : rankings.refetch())}>
            {t("rankings.retry")}
          </Button>
        </div>
      );
    }
    if (!garages || !rankings.data) {
      return <output className="block type-body-m text-muted">{t("common:loading")}</output>;
    }
    if (garages.length === 0) {
      return (
        <div className="flex flex-col items-center gap-16 rounded-2xl border border-dashed border-line-strong px-24 py-48 text-center">
          <span className="flex size-64 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Icon name="wrench" size={32} />
          </span>
          <h2 className="type-h4 text-ink">{t("rankings.empty.title", { city: city?.label })}</h2>
          <p className="max-w-auth type-body-m text-muted">{t("rankings.empty.description")}</p>
        </div>
      );
    }
    return (
      <>
        {list(garages)}
        <Pagination hrefFor={pageHref} page={page} totalPages={rankings.data.meta.totalPages} />
      </>
    );
  };

  return (
    <div className="flex flex-col gap-24 px-20 py-24 md:gap-40 md:px-48 md:py-40 lg:px-80">
      <PageTitle>{t("rankings.pageTitle")}</PageTitle>
      <header className="flex flex-wrap items-end justify-between gap-24">
        <div className="flex min-w-0 flex-col gap-8">
          <p className="type-overline text-brand">{t("rankings.overline")}</p>
          <h1 className="type-h1 text-ink md:type-display-l">
            {city ? (
              <Trans
                components={{ city: <span className="block text-brand" /> }}
                i18nKey="rankings.title"
                t={t}
                values={{ city: city.label }}
              />
            ) : (
              t("rankings.titleNoCity")
            )}
          </h1>
        </div>
        <div className="flex w-full flex-col gap-12 md:w-auto md:flex-row md:items-end">
          <SelectField
            disabled={cities.isPending}
            fieldClassName="md:w-filters"
            icon="map-pin"
            label={t("rankings.city")}
            onChange={(event) => changeCity(event.target.value)}
            value={city ? String(city.id) : ""}
          >
            {!city && <option value="">{t("common:loading")}</option>}
            {cities.options.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </SelectField>
          {partnerAction()}
        </div>
      </header>
      <div className="grid grid-cols-1 items-start gap-24 lg:grid-cols-12">
        <div aria-busy={rankings.isFetching} className="flex flex-col gap-24 lg:col-span-8">
          {body()}
        </div>
        <aside className="flex flex-col gap-16 lg:col-span-4">
          {isWide && (
            <Suspense fallback={<div className="h-map-l w-full rounded-2xl bg-paper" />}>
              <GaragesMap
                area={city?.area ?? null}
                dir={directionOf(getLocale())}
                garages={mapGarages}
                label={t("rankings.map", { city: city?.label ?? "" })}
                zoomInLabel={t("location.zoomIn")}
                zoomOutLabel={t("location.zoomOut")}
              />
            </Suspense>
          )}
          <p className="flex items-start gap-12 rounded-xl border border-line bg-surface p-16 type-body-s text-ink-2">
            <Icon className="shrink-0 text-brand" name="info" size={18} />
            {t("rankings.rule")}
          </p>
        </aside>
      </div>
    </div>
  );
}
