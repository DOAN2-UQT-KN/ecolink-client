import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { LatLngLiteral } from "leaflet";
import { useFormState, useWatch } from "react-hook-form";
import dynamic from "@/libs/dynamic";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/client/shared/Button";
import { useIncident } from "../_hooks/useIncident";
import { useTranslation } from "react-i18next";
import { cn } from "@/libs/utils";
import { IoIosSearch } from "react-icons/io";
import { toast } from "sonner";
import type { IncidentFormValues } from "../_services/incident.service";

const LeafletAddressMap = dynamic(() => import("@/modules/LeafletAddressMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse rounded-xl" />,
});

const NOMINATIM_HEADERS = { Accept: "application/json" } as const;
const REVERSE_DEBOUNCE_MS = 400;
const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
};

type AddressChangeSource = "map" | "gps" | "user" | "hydrate";

type ReverseGeocodingAddress = {
  detailAddress?: string;
};

type ForwardGeocodingResult =
  | { ok: true; lat: number; lng: number; displayName: string }
  | { ok: false; reason: "not_found" | "error" };

type AddressSnapshot = {
  detailAddress: string;
  latitude?: number;
  longitude?: number;
  position: LatLngLiteral | null;
};

function reverseCacheKey(lat: number, lng: number) {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function normalizeAddressQuery(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isSamePosition(a: LatLngLiteral | null, b: LatLngLiteral) {
  if (!a) return false;
  return a.lat.toFixed(4) === b.lat.toFixed(4) && a.lng.toFixed(4) === b.lng.toFixed(4);
}

const Address = memo(function Address() {
  const { t } = useTranslation();
  const { form } = useIncident();
  const { register, setValue, getValues, control } = form;
  const detailAddress = useWatch({ control, name: "detailAddress" });
  const { errors } = useFormState<IncidentFormValues>({
    control,
    name: ["detailAddress", "latitude", "longitude"],
  });
  const [position, setPosition] = useState<LatLngLiteral | null>(null);
  const [forwardWarning, setForwardWarning] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [canConfirm, setCanConfirm] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reverseCacheRef = useRef<Map<string, ReverseGeocodingAddress>>(new Map());
  const forwardCacheRef = useRef<Map<string, ForwardGeocodingResult>>(new Map());
  const skipReverseRef = useRef(false);
  const isEditingRef = useRef(false);
  const snapshotRef = useRef<AddressSnapshot | null>(null);
  const searchGenerationRef = useRef(0);
  const initDoneRef = useRef(false);

  isEditingRef.current = isEditing;

  const applyPosition = useCallback(
    (newPos: LatLngLiteral, source: AddressChangeSource) => {
      if (source === "user" || source === "hydrate") {
        skipReverseRef.current = true;
      }
      setPosition(newPos);
      setValue("latitude", newPos.lat, { shouldDirty: true, shouldValidate: true });
      setValue("longitude", newPos.lng, { shouldDirty: true, shouldValidate: true });
    },
    [setValue],
  );

  const writeDetailAddressFromReverse = useCallback(
    (text: string) => {
      if (isEditingRef.current) return;
      setForwardWarning(null);
      setValue("detailAddress", text, { shouldDirty: true, shouldValidate: true });
    },
    [setValue],
  );

  useEffect(() => {
    register("detailAddress", {
      required: t("Detail address is required"),
    });
    register("latitude", {
      validate: (value) =>
        (typeof value === "number" && !Number.isNaN(value)) ||
        t("Please select a location on the map"),
    });
    register("longitude", {
      validate: (value) =>
        (typeof value === "number" && !Number.isNaN(value)) ||
        t("Please select a location on the map"),
    });
  }, [register, t]);

  const parseAddress = useCallback((data: {
    display_name?: string;
    address?: Record<string, string | undefined>;
  }): ReverseGeocodingAddress => {
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
      detailAddress: parsedDetail,
    };
  }, []);

  const getAddressFromLatLng = useCallback(async (lat: number, lng: number) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: NOMINATIM_HEADERS },
    );

    if (!response.ok) {
      throw new Error("Reverse geocoding failed");
    }

    const data = (await response.json()) as {
      display_name?: string;
      address?: Record<string, string | undefined>;
    };

    return parseAddress(data);
  }, [parseAddress]);

  const getLatLngFromAddress = useCallback(async (query: string): Promise<ForwardGeocodingResult> => {
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
  }, []);

  // Hydrate from existing form coords (skip reverse when address already set); else auto GPS once.
  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    const lat = getValues("latitude");
    const lng = getValues("longitude");
    const hasCoords =
      typeof lat === "number" &&
      typeof lng === "number" &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lng);

    if (hasCoords) {
      const savedAddress = (getValues("detailAddress") || "").trim();
      applyPosition({ lat, lng }, "hydrate");
      if (!savedAddress) {
        skipReverseRef.current = false;
      }
      return;
    }

    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyPosition(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          "gps",
        );
      },
      () => {},
      GPS_OPTIONS,
    );
  }, [applyPosition, getValues]);

  useEffect(() => {
    if (!position) return;

    if (skipReverseRef.current) {
      skipReverseRef.current = false;
      return;
    }

    const cacheKey = reverseCacheKey(position.lat, position.lng);
    const cachedResult = reverseCacheRef.current.get(cacheKey);

    if (cachedResult) {
      if (cachedResult.detailAddress) {
        writeDetailAddressFromReverse(cachedResult.detailAddress);
      }
      return;
    }

    if (reverseTimerRef.current) {
      clearTimeout(reverseTimerRef.current);
    }

    reverseTimerRef.current = setTimeout(async () => {
      try {
        const parsedAddress = await getAddressFromLatLng(position.lat, position.lng);
        reverseCacheRef.current.set(cacheKey, parsedAddress);

        if (parsedAddress.detailAddress) {
          writeDetailAddressFromReverse(parsedAddress.detailAddress);
        }
      } catch {
        // Keep manual form values untouched when reverse geocoding fails.
      }
    }, REVERSE_DEBOUNCE_MS);

    return () => {
      if (reverseTimerRef.current) {
        clearTimeout(reverseTimerRef.current);
      }
    };
  }, [getAddressFromLatLng, position, writeDetailAddressFromReverse]);

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error(t("Geolocation is not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }, "gps");
      },
      () => {
        toast.error(t("No location on device"));
      },
      GPS_OPTIONS,
    );
  }, [applyPosition, t]);

  const startEditing = useCallback(() => {
    snapshotRef.current = {
      detailAddress: getValues("detailAddress") || "",
      latitude: getValues("latitude"),
      longitude: getValues("longitude"),
      position,
    };
    setSearchQuery(getValues("detailAddress") || "");
    setCanConfirm(false);
    setForwardWarning(null);
    setIsEditing(true);
  }, [getValues, position]);

  const exitEditing = useCallback(() => {
    searchGenerationRef.current += 1;
    snapshotRef.current = null;
    setCanConfirm(false);
    setForwardWarning(null);
    setIsSearching(false);
    setSearchQuery("");
    setIsEditing(false);
  }, []);

  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) {
      setCanConfirm(false);
      setForwardWarning(t("Detail address is required"));
      return;
    }

    setIsSearching(true);
    setCanConfirm(false);
    const generation = ++searchGenerationRef.current;

    const cacheKey = normalizeAddressQuery(query);
    const cached = forwardCacheRef.current.get(cacheKey);
    const result = cached ?? (await getLatLngFromAddress(query));

    if (generation !== searchGenerationRef.current || !isEditingRef.current) {
      return;
    }

    if (!cached) {
      forwardCacheRef.current.set(cacheKey, result);
    }

    setIsSearching(false);

    if (!result.ok) {
      setForwardWarning(
        result.reason === "not_found"
          ? t("Location not found. Please enter a different address.")
          : t("Could not look up this address."),
      );
      return;
    }

    setForwardWarning(null);
    if (result.displayName) {
      setSearchQuery(result.displayName);
    }
    const nextPos = { lat: result.lat, lng: result.lng };
    if (!isSamePosition(position, nextPos)) {
      applyPosition(nextPos, "user");
    }
    setCanConfirm(true);
  }, [applyPosition, getLatLngFromAddress, position, searchQuery, t]);

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return;
    setValue("detailAddress", searchQuery.trim(), {
      shouldDirty: true,
      shouldValidate: true,
    });
    exitEditing();
  }, [canConfirm, exitEditing, searchQuery, setValue]);

  const handleCancel = useCallback(() => {
    const snapshot = snapshotRef.current;
    if (snapshot) {
      skipReverseRef.current = true;
      setValue("detailAddress", snapshot.detailAddress, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("latitude", snapshot.latitude, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("longitude", snapshot.longitude, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setPosition(snapshot.position);
    }
    exitEditing();
  }, [exitEditing, setValue]);

  const handleMapPosition = useCallback(
    (pos: LatLngLiteral) => {
      if (isEditingRef.current) return;
      applyPosition(pos, "map");
    },
    [applyPosition],
  );

  const hasLocationError = Boolean(errors.latitude || errors.longitude);

  return (
    <div
      id="incident-address"
      className="w-full h-full flex flex-col gap-[30px] px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5 overflow-y-auto scrollbar-hide"
    >
      <div className="flex gap-3">
        <Field className="w-full h-full gap-2">
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t("Detail address")} <span className="text-destructive">*</span>
          </FieldLabel>

          {!isEditing ? (
            <>
              <p
                className={cn(
                  "min-h-16 rounded-md border border-[rgba(136,122,71,0.5)] bg-muted/40 px-2.5 py-2 text-sm leading-relaxed",
                  detailAddress ? "text-foreground" : "text-foreground-tertiary",
                )}
              >
                {detailAddress || t("Street, house number...")}
              </p>
              <FieldError errors={[errors.detailAddress]} />
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outlined-brown"
                  className="w-fit"
                  onClick={useCurrentLocation}
                >
                  {t("Use current location")}
                </Button>
                <Button
                  type="button"
                  variant="outlined-brown"
                  className="w-fit"
                  onClick={startEditing}
                >
                  {t("Edit")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSearch();
                }}
                className="w-full"
              >
                <div
                  className={cn(
                    "flex h-[50px] w-full overflow-hidden rounded-md border border-[rgba(136,122,71,0.5)]",
                    "focus-within:border-ring focus-within:ring-3 focus-within:ring-[rgba(136,122,71,0.5)]/50",
                    forwardWarning && "border-amber-600",
                  )}
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setCanConfirm(false);
                      setForwardWarning(null);
                    }}
                    placeholder={t("Search...")}
                    disabled={isSearching}
                    className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-foreground-tertiary disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    aria-label={t("Search")}
                    className="flex h-full w-[50px] shrink-0 items-center justify-center border-l border-[rgba(136,122,71,0.5)] bg-button-accent text-white transition-colors hover:bg-button-accent-hover disabled:opacity-60"
                  >
                    {isSearching ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <IoIosSearch size={20} />
                    )}
                  </button>
                </div>
              </form>
              {forwardWarning && (
                <p role="status" className="text-sm font-normal text-amber-700">
                  {forwardWarning}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="brown"
                  isDisabled={!canConfirm || isSearching}
                  onClick={handleConfirm}
                >
                  {t("Confirm")}
                </Button>
                <Button
                  type="button"
                  variant="outlined-brown"
                  onClick={handleCancel}
                >
                  {t("Cancel")}
                </Button>
              </div>
            </>
          )}
        </Field>
      </div>
      <Field className="gap-2">
        <div
          className={cn(
            "relative z-0 w-full h-[575px] rounded-xl overflow-hidden border",
            hasLocationError && "border-destructive ring-2 ring-destructive/30",
          )}
        >
          <LeafletAddressMap
            position={position}
            setPosition={handleMapPosition}
            popupText={detailAddress || t("Selected location")}
          />
        </div>
        <FieldError errors={[errors.latitude, errors.longitude]} />
      </Field>
    </div>
  );
});

export default Address;
