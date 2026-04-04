"use client";

import { memo, useEffect, useState, useRef, useCallback } from "react";
import { MapPin } from "lucide-react";

interface AddressDisplayProps {
  latitude: number | null;
  longitude: number | null;
}

const cache = new Map<string, string>();

const AddressDisplay = memo(function AddressDisplay({
  latitude,
  longitude,
}: AddressDisplayProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAddress = useCallback(async (lat: number, lng: number) => {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (cache.has(cacheKey)) {
      setAddress(cache.get(cacheKey)!);
      return;
    }

    setIsLoading(true);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          headers: {
            Accept: "application/json",
          },
          signal: abortControllerRef.current.signal,
        },
      );

      if (!response.ok) throw new Error("Failed to fetch address");

      const data = await response.json();
      const addr = data.address || {};

      // Selectively build the address string up to city level
      const parts = [
        addr.road,
        addr.suburb || addr.city_district || addr.district,
        addr.city || addr.town || addr.village || addr.municipality,
      ].filter(Boolean);

      const displayAddress =
        parts.length > 0
          ? parts.join(", ")
          : data.display_name?.split(",")[0] || "Unknown Location";

      cache.set(cacheKey, displayAddress);
      setAddress(displayAddress);
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Error fetching address:", error);
        setAddress("Location Unavailable");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      fetchAddress(latitude, longitude);
    } else {
      setAddress(null);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [latitude, longitude, fetchAddress]);

  if (!latitude || !longitude) return null;

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80 min-w-0 max-w-full">
      <span className="truncate" title={address || "Loading location..."}>
        {isLoading ? "Loading..." : address || "Locating..."}
      </span>
    </div>
  );
});

export default AddressDisplay;
