import { useCallback, useEffect, useRef, useState } from "react";
import type { LatLngLiteral } from "leaflet";
import { useTranslation } from "react-i18next";

import { truncateDetailAddress } from "@/constants/address";
import { getCurrentPosition, hasGeolocation } from "@/libs/geo";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";
import { useCampaign } from "../_context/CampaignContext";
import {
  getAddressFromLatLng,
  getLatLngFromAddress,
  isSamePosition,
  normalizeAddressQuery,
  reverseCacheKey,
  type ForwardGeocodingResult,
  type ReverseGeocodingAddress,
} from "../_services/nominatim.service";

const REVERSE_DEBOUNCE_MS = 400;
// maximumAge: 0 matches the old raw navigator call (libs/geo defaults to 30s).
const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 0,
};

type AddressChangeSource = "map" | "gps" | "user" | "hydrate";

type AddressSnapshot = {
  detailAddress: string;
  latitude?: number;
  longitude?: number;
  position: LatLngLiteral | null;
};

/** Map + Nominatim state machine for one meeting point (`meeting_points.<index>`). */
export function useAddressPicker(index: number) {
  const { t } = useTranslation();
  const { form } = useCampaign();
  const { setValue, getValues } = form;
  const LAT = `meeting_points.${index}.latitude` as const;
  const LNG = `meeting_points.${index}.longitude` as const;
  const ADDRESS = `meeting_points.${index}.detail_address` as const;

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
      setValue(LAT, newPos.lat, { shouldDirty: true, shouldValidate: true });
      setValue(LNG, newPos.lng, { shouldDirty: true, shouldValidate: true });
    },
    [LAT, LNG, setValue],
  );

  const writeDetailAddressFromReverse = useCallback(
    (text: string) => {
      if (isEditingRef.current) return;
      setForwardWarning(null);
      setValue(ADDRESS, truncateDetailAddress(text), {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [ADDRESS, setValue],
  );

  // Hydrate from existing form coords (skip reverse when address already set); else auto GPS once.
  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    const lat = getValues(LAT);
    const lng = getValues(LNG);
    const hasCoords =
      typeof lat === "number" &&
      typeof lng === "number" &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lng);

    if (hasCoords) {
      const savedAddress = truncateDetailAddress(getValues(ADDRESS));
      applyPosition({ lat, lng }, "hydrate");
      if (!savedAddress) {
        skipReverseRef.current = false;
      }
      return;
    }

    void getCurrentPosition(GPS_OPTIONS).then((pos) => {
      if (pos) applyPosition({ lat: pos.lat, lng: pos.lng }, "gps");
    });
  }, [LAT, LNG, ADDRESS, applyPosition, getValues]);

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
  }, [position, writeDetailAddressFromReverse]);

  const useCurrentLocation = () => {
    if (!hasGeolocation()) {
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Error,
        title: t("Geolocation is not supported"),
      });
      return;
    }
    void getCurrentPosition(GPS_OPTIONS).then((pos) => {
      if (pos) {
        applyPosition({ lat: pos.lat, lng: pos.lng }, "gps");
        return;
      }
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Error,
        title: t("No location on device"),
      });
    });
  };

  const startEditing = () => {
    snapshotRef.current = {
      detailAddress: getValues(ADDRESS) || "",
      latitude: getValues(LAT),
      longitude: getValues(LNG),
      position,
    };
    setSearchQuery(getValues(ADDRESS) || "");
    setCanConfirm(false);
    setForwardWarning(null);
    setIsEditing(true);
  };

  const exitEditing = () => {
    searchGenerationRef.current += 1;
    snapshotRef.current = null;
    setCanConfirm(false);
    setForwardWarning(null);
    setIsSearching(false);
    setSearchQuery("");
    setIsEditing(false);
  };

  const changeSearchQuery = (value: string) => {
    setSearchQuery(value);
    setCanConfirm(false);
    setForwardWarning(null);
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setCanConfirm(false);
      setForwardWarning(t("Please enter an address to search"));
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
      setSearchQuery(truncateDetailAddress(result.displayName));
    }
    const nextPos = { lat: result.lat, lng: result.lng };
    if (!isSamePosition(position, nextPos)) {
      applyPosition(nextPos, "user");
    }
    setCanConfirm(true);
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    setValue(ADDRESS, truncateDetailAddress(searchQuery), {
      shouldDirty: true,
      shouldValidate: true,
    });
    exitEditing();
  };

  const handleCancel = () => {
    const snapshot = snapshotRef.current;
    if (snapshot) {
      skipReverseRef.current = true;
      setValue(ADDRESS, snapshot.detailAddress, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(LAT, snapshot.latitude, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(LNG, snapshot.longitude, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setPosition(snapshot.position);
    }
    exitEditing();
  };

  // Memoized: the map is a memo component.
  const handleMapPosition = useCallback(
    (pos: LatLngLiteral) => {
      if (isEditingRef.current) return;
      applyPosition(pos, "map");
    },
    [applyPosition],
  );

  return {
    position,
    forwardWarning,
    isEditing,
    canConfirm,
    isSearching,
    searchQuery,
    changeSearchQuery,
    useCurrentLocation,
    startEditing,
    handleSearch,
    handleConfirm,
    handleCancel,
    handleMapPosition,
  };
}
