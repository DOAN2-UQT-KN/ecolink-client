"use client";

import {
  memo,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useTranslation } from "react-i18next";
import { useFormContext, useWatch } from "react-hook-form";
import OrganizationCard from "@/modules/OrganizationCard/OrganizationCard";
import { OrganizationFormValues } from "../_services/organization.service";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/libs/utils";

/** useWatch uses DeepPartial; narrow at runtime for Blob/File previews. */
function usePreviewImageUrl(source: unknown) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (source === "" || source == null) {
      setUrl("");
      return;
    }
    if (typeof source === "string") {
      setUrl(source);
      return;
    }
    if (source instanceof Blob) {
      const objectUrl = URL.createObjectURL(source);
      setUrl(objectUrl);
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }
    setUrl("");
    return;
  }, [source]);

  return url;
}

export const Preview = memo(function Preview() {
  const { t } = useTranslation();
  const { control } = useFormContext<OrganizationFormValues>();
  const [device, setDevice] = useState<"mobile" | "laptop">("mobile");

  const watched = useWatch({ control });

  const logoUrl = usePreviewImageUrl(watched?.logoUrl);
  const backgroundUrl = usePreviewImageUrl(watched?.backgroundUrl);

  const cardProps = useMemo(
    () => ({
      name: watched?.name ?? "",
      description: watched?.description ?? "",
      logoUrl,
      backgroundUrl,
      contactEmail: watched?.contactEmail ?? "",
    }),
    [
      watched?.name,
      watched?.description,
      watched?.contactEmail,
      logoUrl,
      backgroundUrl,
    ],
  );

  const deviceFrameClass = useMemo(
    () =>
      cn(
        "w-full transition-all duration-300",
        device === "mobile" ? "max-w-[375px] mx-auto" : "max-w-[960px] mx-auto",
      ),
    [device],
  );

  const bezelClass = useMemo(
    () =>
      cn(
        "rounded-[1.75rem] bg-neutral-950/90 p-3 shadow-inner ring-1 ring-white/10",
        device === "laptop" && "rounded-xl p-5",
      ),
    [device],
  );

  const handleDeviceChange = useCallback((value: string) => {
    if (value === "mobile" || value === "laptop") {
      setDevice(value);
    }
  }, []);

  const deviceOptions = useMemo(
    () => [
      { value: "mobile" as const, label: t("Mobile device") },
      { value: "laptop" as const, label: t("Laptop device") },
    ],
    [t],
  );

  return (
    <div className="w-full h-full flex flex-col gap-6 px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5 overflow-y-auto scrollbar-hide">
      <div className="flex flex-col gap-2">
        <span className="font-display-5 font-semibold !text-button-accent">
          {t("Preview")}
        </span>
        <p className="text-sm text-foreground-tertiary">
          {t("See how your organization card looks on different screens.")}
        </p>
      </div>

      <div>
        <span className="text-foreground-tertiary font-display-3 text-sm block mb-3">
          {t("Device")}
        </span>
        <RadioGroup
          value={device}
          onValueChange={handleDeviceChange}
          className="flex flex-row gap-4 flex-wrap"
        >
          {deviceOptions.map((option) => (
            <label
              key={option.value}
              htmlFor={`preview-device-${option.value}`}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer flex-1 min-w-[140px] justify-center",
                device === option.value
                  ? "bg-button-accent/10 border-button-accent"
                  : "bg-white/5 border-white/10 hover:border-white/20",
              )}
            >
              <RadioGroupItem
                value={option.value}
                id={`preview-device-${option.value}`}
              />
              <span className="text-sm font-normal">{option.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className={deviceFrameClass}>
        <div className={bezelClass}>
          <OrganizationCard {...cardProps} />
        </div>
      </div>
    </div>
  );
});

export default Preview;
