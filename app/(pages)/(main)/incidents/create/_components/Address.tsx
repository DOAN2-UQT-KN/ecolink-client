"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LatLngLiteral } from "leaflet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
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

  const city = watch("city");
  const district = watch("district");
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
      city: parsedCity,
      district: parsedDistrict,
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

  useEffect(() => {
    if (!position) {
      return;
    }

    const cacheKey = `${position.lat.toFixed(4)},${position.lng.toFixed(4)}`;
    const cachedResult = cacheRef.current.get(cacheKey);

    if (cachedResult) {
      if (cachedResult.city) {
        setValue("city", cachedResult.city, { shouldDirty: true, shouldValidate: true });
      }
      if (cachedResult.district) {
        setValue("district", cachedResult.district, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
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

        if (parsedAddress.city) {
          setValue("city", parsedAddress.city, { shouldDirty: true, shouldValidate: true });
        }
        if (parsedAddress.district) {
          setValue("district", parsedAddress.district, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
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
    const address = [detailAddress, district, city].filter(Boolean).join(", ");
    const finalAddress = address || "Ho Chi Minh, Vietnam";

    return `https://www.google.com/maps?q=${encodeURIComponent(
      finalAddress,
    )}&output=embed`;
  }, [city, district, detailAddress]);

  return (
    <div className="w-full h-full flex flex-col gap-[30px] px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5 overflow-y-auto scrollbar-hide">
      {/* Row 1 */}
      <div className="flex gap-3">
        <Field className="flex-1 gap-2">
          <FieldLabel className="text-foreground-tertiary font-display-3">
            City <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            {...register("city"
              // , { required: "City is required" }
              )}
            placeholder="Enter city"
            className="border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50"
          />
          <FieldError errors={[errors.city]} />
        </Field>

        <Field className="flex-1 gap-2">
          <FieldLabel className="text-foreground-tertiary font-display-3">
            District <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            {...register("district"
              // , { required: "District is required" }
            )}
            placeholder="Enter district"
            className="border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50"
          />
          <FieldError errors={[errors.district]} />
        </Field>
      </div>

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