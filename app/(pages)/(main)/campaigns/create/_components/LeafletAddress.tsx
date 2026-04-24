"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { LatLngLiteral } from "leaflet";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useCampaign } from "../_hooks/useCampaign";

const LeafletAddressMap = dynamic(() => import("@/modules/LeafletAddressMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-xl bg-slate-100 animate-pulse" />
  ),
});

const LeafletAddress = memo(function LeafletAddress() {
  const { t } = useTranslation();
  const { form } = useCampaign();
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const [position, setPosition] = useState<LatLngLiteral | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detailAddress = watch("detail_address");
  const latitudeValue = watch("latitude");
  const longitudeValue = watch("longitude");

  const getAddressFromLatLng = useCallback(async (lat: number, lng: number) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { Accept: "application/json" } },
    );

    if (!response.ok) return undefined;
    const data = (await response.json()) as { display_name?: string };
    return data.display_name;
  }, []);

  useEffect(() => {
    if (!position) return;

    setValue("latitude", position.lat, { shouldDirty: true });
    setValue("longitude", position.lng, { shouldDirty: true });

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      const address = await getAddressFromLatLng(position.lat, position.lng);
      if (address) {
        setValue("detail_address", address, { shouldDirty: true });
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [getAddressFromLatLng, position, setValue]);

  useEffect(() => {
    if (typeof latitudeValue === "number" && typeof longitudeValue === "number") {
      setPosition({ lat: latitudeValue, lng: longitudeValue });
    }
  }, [latitudeValue, longitudeValue]);

  return (
    <div className="w-full h-full flex flex-col gap-[24px] px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5">
      <span className="font-display-5 font-semibold !text-button-accent ">
        {t("Location")}
      </span>

      <Field className="w-full gap-2">
        <FieldLabel className="text-foreground-tertiary font-display-3">
          {t("Detail address")}
        </FieldLabel>
        <Textarea
          {...register("detail_address")}
          placeholder={t("Street, district, city...")}
          className="border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50"
        />
        <FieldError errors={[errors.detail_address]} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t("Latitude")}
          </FieldLabel>
          <Input
            value={latitudeValue ?? ""}
            readOnly
            className="border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50"
          />
        </Field>
        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t("Longitude")}
          </FieldLabel>
          <Input
            value={longitudeValue ?? ""}
            readOnly
            className="border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50"
          />
        </Field>
      </div>

      <div className="w-full h-[380px] rounded-xl overflow-hidden border border-[rgba(136,122,71,0.5)]">
        <LeafletAddressMap
          position={position}
          setPosition={setPosition}
          popupText={detailAddress || t("Selected location")}
        />
      </div>
    </div>
  );
});

export default LeafletAddress;
