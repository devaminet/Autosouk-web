// What the workshop map and the rankings map share.

// OpenStreetMap's own tiles, free under its tile usage policy.
export const tileUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// The wrench icon as markup, for Leaflet's HTML markers.
export const wrenchSvg = (size: number) =>
  `<svg aria-hidden="true" fill="none" height="${size}" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="${size}"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
