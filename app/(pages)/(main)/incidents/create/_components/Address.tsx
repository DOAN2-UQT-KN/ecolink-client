"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LatLngLiteral } from "leaflet";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { useIncidentContext } from "./IncidentContext";
import LeafletAddressMap from "./LeafletAddressMap";

type ReverseGeocodingAddress = {
  city?: string;
  district?: string;
  detailAddress?: string;
};

export default function Address() {
  const { form } = useIncidentContext();
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const [position, setPosition] = useState<LatLngLiteral | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheRef = useRef<Map<string, ReverseGeocodingAddress>>(new Map());

  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const detailAddress = watch("detailAddress");

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
      {
        headers: {
          Accept: "application/json",
        },
      },
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

  // Initial GPS positioning
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(newPos);
          setValue("latitude", newPos.lat);
          setValue("longitude", newPos.lng);
        },
        (error) => {
          console.error("Error getting location:", error);
        },
      );
    }
  }, [setValue]);

  useEffect(() => {
    if (!position) {
      return;
    }

    const cacheKey = `${position.lat.toFixed(4)},${position.lng.toFixed(4)}`;
    const cachedResult = cacheRef.current.get(cacheKey);

    if (cachedResult) {
      if (cachedResult.detailAddress) {
        setValue("detailAddress", cachedResult.detailAddress, { shouldDirty: true });
      }
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const parsedAddress = await getAddressFromLatLng(position.lat, position.lng);
        cacheRef.current.set(cacheKey, parsedAddress);

        setValue("latitude", position.lat, { shouldDirty: true });
        setValue("longitude", position.lng, { shouldDirty: true });

        if (parsedAddress.detailAddress) {
          setValue("detailAddress", parsedAddress.detailAddress, { shouldDirty: true });
        }
      } catch {
        // Keep manual form values untouched when reverse geocoding fails.
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [getAddressFromLatLng, position, setValue]);

  // Tạo query address
  const mapSrc = useMemo(() => {
    const finalAddress = detailAddress || "Ho Chi Minh, Vietnam";

    return `https://www.google.com/maps?q=${encodeURIComponent(
      finalAddress,
    )}&output=embed`;
  }, [detailAddress]);

  return (
    <div className="w-full h-full flex flex-col gap-[30px] px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5 overflow-y-auto scrollbar-hide">
      {/* Row 1 REMOVED: City and District inputs */}

      <div className="flex gap-3 ">
        {/* Detail */}
        <Field className="w-full h-full gap-2">
          <FieldLabel className="text-foreground-tertiary font-display-3">
            Detail Address
          </FieldLabel>
          <Textarea
            {...register("detailAddress")}
            placeholder="Street, house number..."
            className="border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50"
          />
        </Field>

        {/* <div className="w-1/2 h-[250px] rounded-xl overflow-hidden border">
          <LeafletAddressMap
            position={position}
            setPosition={setPosition}
            popupText={detailAddress || "Selected location"}
          />
        </div> */}
      </div>
      <div className="w-full h-[575px] rounded-xl overflow-hidden border">
          <LeafletAddressMap
            position={position}
            setPosition={setPosition}
            popupText={detailAddress || "Selected location"}
          />
        </div>
      {/* <div className="w-full h-[250px] rounded-xl overflow-hidden border">
        <iframe title="Google Map" width="100%" height="100%" loading="lazy" src={mapSrc} />
      </div> */}
    </div>
  );
}