import { lazy, Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { SelectField } from "../../../components/SelectField";
import { TextField } from "../../../components/TextField";
import { ApiError } from "../../../lib/api/client";
import { fieldError } from "../../../lib/api/errors";
import { getLocale } from "../../../lib/i18n";
import { directionOf } from "../../../lib/locale";
import { cityOfPin, isInArea, zoomForArea } from "../geo";
import type { CityArea, CityChoice } from "../geo";
import type { LatLng, MapView } from "./WorkshopMap";

// Leaflet is large, so only this page downloads it.
const WorkshopMap = lazy(async () => ({ default: (await import("./WorkshopMap")).WorkshopMap }));

type LocationSectionProps = {
  cityId: string;
  address: string;
  position: LatLng | null;
  cities: CityChoice[];
  onCityChange: (cityId: string) => void;
  onAddressChange: (address: string) => void;
  onPositionChange: (position: LatLng | null) => void;
  error: unknown;
};

// All of Morocco, until the city is known.
const moroccoView: MapView = { lat: 31.8, lng: -7.1, zoom: 5 };
// Close enough to tell one entrance from the next.
const streetZoom = 17;

const areaView = (area: CityArea): MapView => ({ lat: area.lat, lng: area.lng, zoom: zoomForArea(area) });

// About ten centimetres: more digits only add noise.
const rounded = ({ lat, lng }: LatLng): LatLng => ({
  lat: Math.round(lat * 1e6) / 1e6,
  lng: Math.round(lng * 1e6) / 1e6,
});

// The API's message about the pin, or ours when it is simply missing.
const pinErrorOf = (error: unknown, missing: string) => {
  if (!(error instanceof ApiError)) {
    return undefined;
  }
  const issue = error.issues.find(({ field }) => field === "latitude" || field === "longitude");
  if (!issue) {
    return undefined;
  }
  return issue.code.startsWith("validation.") ? missing : issue.message;
};

// The city and the pin always agree: a pin picks the city it is in, and
// another city moves the map there and drops a pin left outside it.
export function LocationSection({
  cityId,
  address,
  position,
  cities,
  onCityChange,
  onAddressChange,
  onPositionChange,
  error,
}: LocationSectionProps) {
  const { t } = useTranslation("mechanics");
  const chosen = cities.find(({ id }) => String(id) === cityId) ?? null;
  // A new object on every render would redraw the circle and move the map.
  const { lat, lng, radiusKm } = chosen?.area ?? {};
  const area = useMemo(
    () => (lat === undefined || lng === undefined || radiusKm === undefined ? null : { lat, lng, radiusKm }),
    [lat, lng, radiusKm],
  );
  const [movedView, setView] = useState<MapView | null>(() => (position ? { ...position, zoom: 16 } : null));
  // Until the mechanic moves it, the map shows the chosen city once it loads.
  const view = useMemo(() => movedView ?? (area ? areaView(area) : moroccoView), [movedView, area]);
  const [locating, setLocating] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const pinError = pinErrorOf(error, t("location.pinRequired"));

  // Returns whether the pin went there.
  const place = (spot: LatLng) => {
    const next = rounded(spot);
    setNotice(null);
    // Without coordinates for the city, the API can't check, so neither do we.
    if (!area) {
      setProblem(null);
      onPositionChange(next);
      return true;
    }
    const city = cityOfPin(cities, next, chosen?.id ?? null);
    if (!city) {
      setProblem(t("location.outsideCities"));
      return false;
    }
    setProblem(null);
    onPositionChange(next);
    // Keeps the map where it is, even when the city changes below.
    if (!movedView) {
      setView(view);
    }
    if (city.id !== chosen?.id) {
      onCityChange(String(city.id));
      setNotice(t("location.cityMatched", { city: city.label }));
    }
    return true;
  };

  const chooseCity = (nextId: string) => {
    onCityChange(nextId);
    setProblem(null);
    setNotice(null);
    const nextArea = cities.find(({ id }) => String(id) === nextId)?.area;
    if (!nextArea) {
      return;
    }
    setView(areaView(nextArea));
    if (position && !isInArea(nextArea, position)) {
      onPositionChange(null);
      setNotice(t("location.pinCleared"));
    }
  };

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setProblem(t("location.unsupported"));
      return;
    }
    setLocating(true);
    setProblem(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        const spot = { lat: coords.latitude, lng: coords.longitude };
        if (place(spot)) {
          setView({ ...rounded(spot), zoom: streetZoom });
        }
      },
      (failure) => {
        setLocating(false);
        setProblem(t(failure.code === failure.PERMISSION_DENIED ? "location.denied" : "location.unavailable"));
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  };

  return (
    <div className="flex flex-col gap-20">
      <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
        <SelectField
          error={fieldError(error, "cityId")}
          icon="map-pin"
          label={t("location.city")}
          onChange={(event) => chooseCity(event.target.value)}
          value={cityId}
        >
          <option disabled value="">
            {t("location.chooseCity")}
          </option>
          {cities.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </SelectField>
        <TextField
          autoComplete="street-address"
          dir="auto"
          error={fieldError(error, "address")}
          label={t("location.address")}
          onChange={(event) => onAddressChange(event.target.value)}
          value={address}
        />
      </div>
      <div className="flex flex-col gap-12">
        <div className="flex flex-wrap items-center justify-between gap-12">
          <p className="type-body-s text-muted">{t(position ? "location.hint" : "location.noPin")}</p>
          <Button disabled={locating} isPending={locating} onClick={locate} size="s">
            <Icon name="map-pin" size={16} />
            {t(locating ? "location.locating" : "location.useMyLocation")}
          </Button>
        </div>
        <div className="relative">
          <Suspense fallback={<div className="h-map w-full rounded-lg bg-paper" />}>
            <WorkshopMap
              dir={directionOf(getLocale())}
              area={area}
              label={t("location.map")}
              onChange={place}
              pinLabel={t("location.pin")}
              position={position}
              view={view}
              zoomInLabel={t("location.zoomIn")}
              zoomOutLabel={t("location.zoomOut")}
            />
          </Suspense>
          {position && (
            <p className="pointer-events-none absolute start-12 top-12 z-10 flex flex-col items-start gap-4 type-mono-s text-ink">
              <span className="rounded-full bg-surface px-8 py-4 shadow-elevation-1">
                {t("location.latitude")} <bdi dir="ltr">{position.lat.toFixed(4)}</bdi>
              </span>
              <span className="rounded-full bg-surface px-8 py-4 shadow-elevation-1">
                {t("location.longitude")} <bdi dir="ltr">{position.lng.toFixed(4)}</bdi>
              </span>
            </p>
          )}
        </div>
        <output className="block type-body-s text-info empty:hidden">{notice}</output>
        <div className="flex flex-col gap-8 empty:hidden" role="alert">
          {problem && <p className="type-body-s text-danger">{problem}</p>}
          {pinError && <p className="type-body-s text-danger">{pinError}</p>}
        </div>
      </div>
    </div>
  );
}
