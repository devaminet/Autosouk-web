import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { CityArea } from "../geo";
import { attribution, tileUrl, wrenchSvg } from "../mapParts";

export type LatLng = { lat: number; lng: number };

export type MapView = LatLng & { zoom: number };

type WorkshopMapProps = {
  position: LatLng | null;
  // The chosen city's area, drawn as a circle the pin must stay in.
  area: CityArea | null;
  // Where the map looks. A new object moves it there; clicks and drags don't.
  view: MapView;
  onChange: (position: LatLng) => void;
  label: string;
  pinLabel: string;
  zoomInLabel: string;
  zoomOutLabel: string;
  // The map itself never flips, but its controls sit at the end of the line.
  dir: "ltr" | "rtl";
};

// How far one arrow key press moves the pin, in screen pixels.
const keyStep = 8;

const keyMoves: Record<string, [number, number]> = {
  ArrowUp: [0, -keyStep],
  ArrowDown: [0, keyStep],
  ArrowLeft: [-keyStep, 0],
  ArrowRight: [keyStep, 0],
};

// The wrench icon in a brand circle, as in the design.
const pinIcon = L.divIcon({
  className: "",
  html: `<span class="flex size-40 items-center justify-center rounded-full bg-brand text-on-brand shadow-elevation-brand ring-4 ring-surface">${wrenchSvg(18)}</span>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const toLatLng = ({ lat, lng }: L.LatLng): LatLng => ({ lat, lng });

// A Leaflet map with one pin. Clicking the map places the pin, and the pin
// can be dragged, or moved with the arrow keys once focused.
export function WorkshopMap({
  position,
  area,
  view,
  onChange,
  label,
  pinLabel,
  zoomInLabel,
  zoomOutLabel,
  dir,
}: WorkshopMapProps) {
  const container = useRef<HTMLElement>(null);
  const map = useRef<L.Map | null>(null);
  const pin = useRef<L.Marker | null>(null);
  // Leaflet keeps the handlers it was given, so they read the latest callback.
  const latestOnChange = useRef(onChange);
  const latestPosition = useRef(position);
  const firstView = useRef(view);

  useEffect(() => {
    latestOnChange.current = onChange;
    latestPosition.current = position;
  });

  useEffect(() => {
    if (!container.current) {
      return undefined;
    }
    const { lat, lng, zoom } = firstView.current;
    const instance = L.map(container.current, {
      attributionControl: false,
      zoomControl: false,
      center: [lat, lng],
      zoom,
    });
    L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(instance);
    instance.on("click", (event) => latestOnChange.current(toLatLng(event.latlng)));
    map.current = instance;
    return () => {
      instance.remove();
      map.current = null;
      pin.current = null;
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
    map.current?.setView([view.lat, view.lng], view.zoom);
  }, [view]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !area) {
      return undefined;
    }
    // Leaflet draws in SVG, so it takes the theme's colour as a value.
    const brand = getComputedStyle(document.documentElement).getPropertyValue("--color-brand").trim() || undefined;
    const circle = L.circle(area, {
      radius: area.radiusKm * 1000,
      color: brand,
      weight: 2,
      dashArray: "6 6",
      fillOpacity: 0.05,
      interactive: false,
    }).addTo(instance);
    return () => {
      circle.remove();
    };
  }, [area]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) {
      return;
    }
    if (!position) {
      pin.current?.remove();
      pin.current = null;
      return;
    }
    if (pin.current) {
      pin.current.setLatLng(position);
      return;
    }
    const marker = L.marker(position, { icon: pinIcon, draggable: true, keyboard: true, autoPan: true });
    marker.on("dragend", () => {
      const dropped = toLatLng(marker.getLatLng());
      // The pin stays where it was unless the form accepts the new spot.
      if (latestPosition.current) {
        marker.setLatLng(latestPosition.current);
      }
      latestOnChange.current(dropped);
    });
    marker.addTo(instance);
    marker.getElement()?.addEventListener("keydown", (event) => {
      const move = keyMoves[event.key];
      if (!move) {
        return;
      }
      // The map would pan on the same keys.
      event.preventDefault();
      event.stopPropagation();
      const zoom = instance.getZoom();
      const point = instance.project(marker.getLatLng(), zoom).add(move);
      latestOnChange.current(toLatLng(instance.unproject(point, zoom)));
    });
    pin.current = marker;
  }, [position]);

  useEffect(() => {
    const element = pin.current?.getElement();
    element?.setAttribute("aria-label", pinLabel);
    element?.setAttribute("title", pinLabel);
  }, [pinLabel, position]);

  return (
    <section
      aria-label={label}
      className="isolate h-map w-full overflow-hidden rounded-lg bg-paper"
      dir="ltr"
      ref={container}
    />
  );
}
