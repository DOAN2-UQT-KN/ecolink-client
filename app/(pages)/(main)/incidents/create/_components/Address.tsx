"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LatLngLiteral } from "leaflet";
import dynamic from "next/dynamic";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { useIncident } from "../_hooks/useIncident";

const LeafletAddressMap = dynamic(() => import("./LeafletAddressMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 animate-pulse rounded-xl" />,
});

type ReverseGeocodingAddress = {
  city?: string;
  district?: string;
  detailAddress?: string;
};

const Address = memo(function Address() {
  const { form } = useIncident();
  const {
    register,
    watch,
    setValue,
  } = form;
  const [position, setPosition] = useState<LatLngLiteral | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheRef = useRef<Map<string, ReverseGeocodingAddress>>(new Map());

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

      </div>
      <div className="w-full h-[575px] rounded-xl overflow-hidden border">
          <LeafletAddressMap
            position={position}
            setPosition={setPosition}
            popupText={detailAddress || "Selected location"}
          />
        </div>
    </div>
  );
});

export default Address;