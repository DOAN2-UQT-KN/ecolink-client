// Direct fetch is the allowed exception (constitution VII): Goong REST is a third-party API, not ours.

import { truncateDetailAddress } from "@/constants/address";
import { GOONG_API_KEY, GOONG_REST_BASE } from "@/libs/goong";

export type LatLng = { lat: number; lng: number };

export type ReverseGeocodingAddress = {
  detailAddress?: string;
};

export type ForwardGeocodingResult =
  | { ok: true; lat: number; lng: number; displayName: string }
  | { ok: false; reason: "not_found" | "error" };

/** Goong follows the Google Geocoding response shape. */
export type GoongGeocodeResponse = {
  status?: string;
  results?: Array<{
    formatted_address?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
  }>;
};

export function reverseCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

export function normalizeAddressQuery(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isSamePosition(a: LatLng | null, b: LatLng): boolean {
  if (!a) return false;
  return a.lat.toFixed(4) === b.lat.toFixed(4) && a.lng.toFixed(4) === b.lng.toFixed(4);
}

export function parseAddress(data: GoongGeocodeResponse): ReverseGeocodingAddress {
  const formatted = data.results?.[0]?.formatted_address?.trim() ?? "";
  return {
    detailAddress: truncateDetailAddress(formatted) || undefined,
  };
}

export function parseForwardResult(data: GoongGeocodeResponse): ForwardGeocodingResult {
  if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    return { ok: false, reason: "error" };
  }
  const first = data.results?.[0];
  const lat = Number(first?.geometry?.location?.lat);
  const lng = Number(first?.geometry?.location?.lng);
  if (!first || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, reason: "not_found" };
  }
  return { ok: true, lat, lng, displayName: first.formatted_address?.trim() ?? "" };
}

/** Throws when the request fails; callers keep the form untouched. */
export async function getAddressFromLatLng(
  lat: number,
  lng: number,
): Promise<ReverseGeocodingAddress> {
  if (!GOONG_API_KEY) {
    throw new Error("Goong API key is not configured");
  }

  const response = await fetch(
    `${GOONG_REST_BASE}/Geocode?latlng=${lat},${lng}&api_key=${encodeURIComponent(GOONG_API_KEY)}`,
  );

  if (!response.ok) {
    throw new Error("Reverse geocoding failed");
  }

  return parseAddress((await response.json()) as GoongGeocodeResponse);
}

export async function getLatLngFromAddress(query: string): Promise<ForwardGeocodingResult> {
  if (!GOONG_API_KEY) return { ok: false, reason: "error" };

  try {
    const response = await fetch(
      `${GOONG_REST_BASE}/geocode?address=${encodeURIComponent(query)}&api_key=${encodeURIComponent(GOONG_API_KEY)}`,
    );

    if (!response.ok) {
      return { ok: false, reason: "error" };
    }

    return parseForwardResult((await response.json()) as GoongGeocodeResponse);
  } catch {
    return { ok: false, reason: "error" };
  }
}
