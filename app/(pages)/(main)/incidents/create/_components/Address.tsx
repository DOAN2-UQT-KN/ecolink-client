"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useIncidentContext } from "./IncidentContext";

export default function Address() {
  const { form } = useIncidentContext();
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const city = watch("city");
  const district = watch("district");
  const detailAddress = watch("detailAddress");

  // Tạo query address
  const mapSrc = useMemo(() => {
    const address = [detailAddress, district, city].filter(Boolean).join(", ");
    const finalAddress = address || "Ho Chi Minh, Vietnam";
  
    return `https://www.google.com/maps?q=${encodeURIComponent(
      finalAddress
    )}&output=embed`;
  }, [city, district, detailAddress]);
  
  return (
    <div className="w-full h-fit flex flex-col gap-[30px] px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[20px] bg-white/50 shadow-lg ring-1 ring-white/5 overflow-y-auto scrollbar-hide">
      
      {/* Row 1 */}
      <div className="flex gap-3">
        <Field className="flex-1 gap-2">
          <FieldLabel className="text-foreground-tertiary font-display-3">
            City <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            {...register("city", { required: "City is required" })}
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
            {...register("district", { required: "District is required" })}
            placeholder="Enter district"
            className="border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50"
          />
          <FieldError errors={[errors.district]} />
        </Field>
      </div>

      <div className="flex gap-3 h-full ">

      {/* Detail */}
      <Field className="w-1/2 h-full gap-2">
        <FieldLabel className="text-foreground-tertiary font-display-3">
          Detail Address
        </FieldLabel>
        <Textarea
          {...register("detailAddress")}
          placeholder="Street, house number..."
          className="border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50"
        />
      </Field>

      <div className="w-1/2 h-[250px] rounded-xl overflow-hidden border">
        <iframe
          title="Google Map"
          width="100%"
          height="100%"
          loading="lazy"
          src={mapSrc}
        />
      </div>
      </div>
    </div>
  );
}