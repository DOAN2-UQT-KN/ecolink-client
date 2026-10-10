import type { LatLngLiteral } from "leaflet";

export const REVERSE_DEBOUNCE_MS = 400;
// maximumAge: 0 matches the old raw navigator call (libs/geo defaults to 30s).
export const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 0,
};

export type AddressChangeSource = "map" | "gps" | "user" | "hydrate";

export type AddressSnapshot = {
  detailAddress: string;
  latitude?: number;
  longitude?: number;
  position: LatLngLiteral | null;
};

/** Saved form coordinates as a position, or null when either is missing or NaN. */
export const toLatLng = (lat: unknown, lng: unknown): LatLngLiteral | null =>
  typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng)
    ? { lat, lng }
    : null;
