import { lazy, Suspense, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router";
import { Alert } from "../../../components/Alert";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { PageTitle } from "../../../components/PageTitle";
import { Tabs } from "../../../components/Tabs";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { formatNumber } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import { directionOf } from "../../../lib/locale";
import { paths } from "../../../lib/paths";
import { GarageGallery } from "../components/GarageGallery";
import { InspectionCard } from "../components/InspectionCard";
import { MechanicIdentity } from "../components/MechanicIdentity";
import { ReviewsSection } from "../components/ReviewsSection";
import { useMechanic } from "../hooks";

// Leaflet is large, so only pages with a map download it.
const GaragesMap = lazy(async () => ({ default: (await import("../components/GaragesMap")).GaragesMap }));

const tabIds = ["reviews", "photos"] as const;

type TabId = (typeof tabIds)[number];

const mechanicIdFrom = ({ mechanicId = "" }: { mechanicId?: string }): number | null =>
  /^\d+$/u.test(mechanicId) ? Number(mechanicId) : null;

// A workshop as buyers see it: photos, rating and reviews, price and location.
export function MechanicPage() {
  const { t } = useTranslation(["mechanics", "enums", "listings"]);
  const id = mechanicIdFrom(useParams());
  const query = useMechanic(id);
  const [params, setParams] = useSearchParams();
  const tab = tabIds.find((item) => item === params.get("tab")) ?? "reviews";
  const mechanic = query.data;
  // The card sits beside the tabs on wide screens, and above them on small ones.
  const isWide = useMediaQuery("(min-width: 64rem)");

  const mapGarages = useMemo(
    () =>
      mechanic
        ? [
            {
              id: mechanic.id,
              name: mechanic.name,
              lat: mechanic.latitude,
              lng: mechanic.longitude,
              price:
                mechanic.inspectionPrice === null
                  ? t("rankings.priceAtGarage")
                  : `${formatNumber(mechanic.inspectionPrice)} ${t("listings:units.mad")}`,
              isTop: true,
            },
          ]
        : [],
    [mechanic, t],
  );

  if (id === null || query.error) {
    return (
      <div className="flex flex-col items-start gap-16 px-20 py-24 md:px-48 md:py-40 lg:px-80" role="alert">
        <Alert tone="danger">{query.error?.message ?? t("profile.notFound")}</Alert>
        <ButtonLink to={paths.mechanics}>{t("profile.allGarages")}</ButtonLink>
      </div>
    );
  }
  if (!mechanic) {
    return <output className="block px-20 py-24 type-body-m text-muted md:px-48 md:py-40 lg:px-80">{t("common:loading")}</output>;
  }

  const city = t(`enums:city.${mechanic.city.slug}`, { defaultValue: mechanic.city.name });
  const select = (next: TabId) =>
    setParams(next === "reviews" ? {} : { tab: next }, { preventScrollReset: true, replace: true });

  return (
    <div className="flex flex-col gap-24 px-20 py-24 md:px-48 md:py-40 lg:px-80">
      <PageTitle>{mechanic.name}</PageTitle>
      <GarageGallery photos={mechanic.garageImages} />
      <div className="grid grid-cols-1 items-start gap-32 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-32 lg:col-span-2">
          <MechanicIdentity city={city} mechanic={mechanic} />
          {!isWide && <InspectionCard city={city} mechanic={mechanic} />}
          <Tabs
            label={t("profile.sections")}
            onSelect={select}
            selected={tab}
            tabs={[
              {
                id: "reviews",
                label: t("profile.reviewsTab"),
                count: mechanic.rating.count,
                panel: <ReviewsSection mechanic={mechanic} />,
              },
              {
                id: "photos",
                label: t("profile.photosTab"),
                count: mechanic.garageImages.length,
                panel:
                  mechanic.garageImages.length === 0 ? (
                    <p className="type-body-m text-muted">{t("profile.noPhotos")}</p>
                  ) : (
                    <ul className="grid grid-cols-2 gap-12 md:grid-cols-3">
                      {mechanic.garageImages.map(({ id: photoId, link }, index) => (
                        <li className="aspect-4/3 overflow-hidden rounded-xl bg-paper" key={photoId}>
                          <img
                            alt={t("profile.photo", { number: index + 1 })}
                            className="size-full object-cover"
                            loading="lazy"
                            src={link}
                          />
                        </li>
                      ))}
                    </ul>
                  ),
              },
            ]}
          />
        </div>
        <aside className="flex flex-col gap-16">
          {isWide && <InspectionCard city={city} mechanic={mechanic} />}
          {mechanic.description && (
            <section className="flex flex-col gap-12 rounded-2xl border border-line bg-surface p-24">
              <h2 className="type-h4 text-ink">{t("profile.about")}</h2>
              <p className="type-body-s whitespace-pre-line text-ink-2" dir="auto">
                {mechanic.description}
              </p>
            </section>
          )}
          <Suspense fallback={<div className="h-map w-full rounded-2xl bg-paper" />}>
            <GaragesMap
              area={null}
              dir={directionOf(getLocale())}
              garages={mapGarages}
              label={t("profile.map", { name: mechanic.name })}
              size="m"
              zoomInLabel={t("location.zoomIn")}
              zoomOutLabel={t("location.zoomOut")}
            />
          </Suspense>
          <p className="flex items-start gap-8 type-body-s text-muted">
            <Icon className="shrink-0" name="map-pin" size={16} />
            <span dir="auto">
              {mechanic.address}, {city}
            </span>
          </p>
        </aside>
      </div>
    </div>
  );
}
