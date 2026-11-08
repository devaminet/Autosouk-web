import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { CityArea } from "../geo";
import { zoomForArea } from "../geo";
import { attribution, tileUrl, wrenchSvg } from "../mapParts";

export type MapGarage = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  // Such as "350 MAD", already translated.
  price: string;
  // The best rated garage stands out.
  isTop: boolean;
};

type RankingsMapProps = {
  garages: MapGarage[];
  // Where to look when there is no garage to show.
  area: CityArea | null;
  label: string;
  zoomInLabel: string;
  zoomOutLabel: string;
  // The map itself never flips, but its controls sit at the end of the line.
  dir: "ltr" | "rtl";
};

// All of Morocco, until the city is known.
const moroccoView = { center: L.latLng(31.8, -7.1), zoom: 5 };
// Close enough for the streets, even with a single garage.
const maxFitZoom = 15;

const pillClass = {
  top: "bg-brand text-on-brand shadow-elevation-brand",
  other: "bg-surface text-ink shadow-elevation-1",
};
const iconClass = {
  top: "bg-on-brand text-brand",
  other: "bg-brand-soft text-brand",
};

// Built from elements, not markup, so names and prices are never read as HTML.
const priceIcon = (garage: MapGarage, dir: "ltr" | "rtl") => {
  const tone = garage.isTop ? "top" : "other";
  const pill = document.createElement("span");
  pill.className = `flex w-max items-center gap-8 rounded-full py-4 ps-4 pe-12 type-label-s ${pillClass[tone]}`;
  // The icon stays first, where the marker's anchor is.
  pill.dir = "ltr";
  const icon = document.createElement("span");
  icon.className = `flex size-24 items-center justify-center rounded-full ${iconClass[tone]}`;
  // The SVG is our own constant, never data from the API.
  icon.innerHTML = wrenchSvg(14);
  const price = document.createElement("span");
  // The price reads in the page's direction.
  price.dir = dir;
  price.textContent = garage.price;
  pill.append(icon, price);
  // No size, so the pill is as wide as its price. The anchor is the icon's centre.
  return L.divIcon({ className: "", html: pill, iconSize: undefined, iconAnchor: [16, 16] });
};

// The garages of the page on an OpenStreetMap map, each with its price.
export function RankingsMap({ garages, area, label, zoomInLabel, zoomOutLabel, dir }: RankingsMapProps) {
  const container = useRef<HTMLElement>(null);
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!container.current) {
      return undefined;
    }
    const instance = L.map(container.current, {
      attributionControl: false,
      zoomControl: false,
      ...moroccoView,
    });
    L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(instance);
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance) {
      return undefined;
    }
    const end = dir === "rtl" ? "left" : "right";
    const zoom = L.control
      .zoom({ position: `top${end}`, zoomInTitle: zoomInLabel, zoomOutTitle: zoomOutLabel })
      .addTo(instance);
    const credits = L.control.attribution({ position: `bottom${end}` }).addTo(instance);
    return () => {
      zoom.remove();
      credits.remove();
    };
  }, [dir, zoomInLabel, zoomOutLabel]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) {
      return undefined;
    }
    const markers = garages.map((garage) =>
      L.marker([garage.lat, garage.lng], {
        icon: priceIcon(garage, dir),
        title: garage.name,
        keyboard: false,
        // The best rated garage stays on top of its neighbours.
        zIndexOffset: garage.isTop ? 1000 : 0,
      }).addTo(instance),
    );
    if (markers.length > 0) {
      instance.fitBounds(L.latLngBounds(garages.map(({ lat, lng }) => [lat, lng])), {
        padding: [48, 48],
        maxZoom: maxFitZoom,
      });
    } else if (area) {
      instance.setView([area.lat, area.lng], zoomForArea(area));
    }
    return () => {
      for (const marker of markers) {
        marker.remove();
      }
    };
  }, [garages, area, dir]);

  return (
    <section
      aria-label={label}
      className="isolate h-map-l w-full overflow-hidden rounded-2xl bg-paper"
      dir="ltr"
      ref={container}
    />
  );
}
