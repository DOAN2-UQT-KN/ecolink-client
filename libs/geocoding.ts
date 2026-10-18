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

export type AddressSuggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
};

type GoongAutocompleteResponse = {
  status?: string;
  predictions?: Array<{
    place_id?: string;
    description?: string;
    structured_formatting?: { main_text?: string; secondary_text?: string };
  }>;
};

type GoongPlaceDetailResponse = {
  status?: string;
  result?: {
    formatted_address?: string;
    name?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
  };
};

/** Suggestions while typing (Goong Place AutoComplete), biased towards `near`. Throws on failure. */
export async function autocompleteAddress(input: string, near?: LatLng | null): Promise<AddressSuggestion[]> {
  if (!GOONG_API_KEY) return [];
  const params = new URLSearchParams({ input, limit: "5", api_key: GOONG_API_KEY });
  if (near) params.set("location", `${near.lat},${near.lng}`);
  const response = await fetch(`${GOONG_REST_BASE}/Place/AutoComplete?${params}`);
  if (!response.ok) throw new Error("Address autocomplete failed");

  const data = (await response.json()) as GoongAutocompleteResponse;
  return (data.predictions ?? []).flatMap((p) =>
    p.place_id && p.description
      ? [
          {
            placeId: p.place_id,
            description: p.description,
            mainText: p.structured_formatting?.main_text ?? p.description,
            secondaryText: p.structured_formatting?.secondary_text ?? "",
          },
        ]
      : [],
  );
}

/** Coordinates of a picked suggestion (Goong Place Detail), in the same shape as a forward search. */
export async function getPlaceLocation(placeId: string): Promise<ForwardGeocodingResult> {
  if (!GOONG_API_KEY) return { ok: false, reason: "error" };
  try {
    const params = new URLSearchParams({ place_id: placeId, api_key: GOONG_API_KEY });
    const response = await fetch(`${GOONG_REST_BASE}/Place/Detail?${params}`);
    if (!response.ok) return { ok: false, reason: "error" };

    const data = (await response.json()) as GoongPlaceDetailResponse;
    const lat = Number(data.result?.geometry?.location?.lat);
    const lng = Number(data.result?.geometry?.location?.lng);
    if (!data.result || !Number.isFinite(lat) || !Number.isFinite(lng)) return { ok: false, reason: "not_found" };
    return { ok: true, lat, lng, displayName: data.result.formatted_address?.trim() || data.result.name?.trim() || "" };
  } catch {
    return { ok: false, reason: "error" };
  }
}
