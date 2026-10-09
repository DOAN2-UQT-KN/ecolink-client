// Direct fetch is the allowed exception here: Nominatim is a third-party API, not ours.
import type { LatLngLiteral } from "leaflet";

import { truncateDetailAddress } from "@/constants/address";

const NOMINATIM_HEADERS = { Accept: "application/json" } as const;

export type ReverseGeocodingAddress = {
  detailAddress?: string;
};

export type ForwardGeocodingResult =
  | { ok: true; lat: number; lng: number; displayName: string }
  | { ok: false; reason: "not_found" | "error" };

type NominatimReverseResponse = {
  display_name?: string;
  address?: Record<string, string | undefined>;
};

export function reverseCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

export function normalizeAddressQuery(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isSamePosition(a: LatLngLiteral | null, b: LatLngLiteral): boolean {
  if (!a) return false;
  return a.lat.toFixed(4) === b.lat.toFixed(4) && a.lng.toFixed(4) === b.lng.toFixed(4);
}

export function parseAddress(data: NominatimReverseResponse): ReverseGeocodingAddress {
  const address = data.address ?? {};
  const parsedCity =
    address.city ??
    address.town ??
    address.state ??
    address.province ??
    address.municipality;
  const parsedDistrict =
    address.county ??
    address.city_district ??
    address.district ??
    address.suburb ??
    address.quarter;
  const parsedDetail =
    data.display_name ??
    [address.road, address.house_number, parsedDistrict, parsedCity]
      .filter(Boolean)
      .join(", ");

  return {
    detailAddress: truncateDetailAddress(parsedDetail) || undefined,
  };
}

/** Throws when the request fails; callers keep the form untouched. */
export async function getAddressFromLatLng(
  lat: number,
  lng: number,
): Promise<ReverseGeocodingAddress> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: NOMINATIM_HEADERS },
  );

  if (!response.ok) {
    throw new Error("Reverse geocoding failed");
  }

  const data = (await response.json()) as NominatimReverseResponse;

  return parseAddress(data);
}

export async function getLatLngFromAddress(query: string): Promise<ForwardGeocodingResult> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: NOMINATIM_HEADERS },
    );

    if (!response.ok) {
      return { ok: false, reason: "error" };
    }

    const data = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
      display_name?: string;
    }>;
    const first = data[0];
    const lat = first?.lat != null ? Number(first.lat) : NaN;
    const lng = first?.lon != null ? Number(first.lon) : NaN;
    const displayName = first?.display_name?.trim() ?? "";

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { ok: false, reason: "not_found" };
    }

    return { ok: true, lat, lng, displayName };
  } catch {
    return { ok: false, reason: "error" };
  }
}
