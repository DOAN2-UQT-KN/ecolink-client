"use client";

import { memo, useCallback, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import OrganizationCard from "@/modules/OrganizationCard/OrganizationCard";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/libs/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type PreviewOrganizationPopoverProps = {
  name: string;
  description: string;
  logoUrl: string;
  backgroundUrl: string;
  contactEmail: string;
  theme?: "light" | "dark";
  trigger: ReactNode;
};

export const PreviewOrganizationPopover = memo(function PreviewOrganizationPopover({
  name,
  description,
  logoUrl,
  backgroundUrl,
  contactEmail,
  theme = "dark",
  trigger,
}: PreviewOrganizationPopoverProps) {
  const { t } = useTranslation();
  const [device, setDevice] = useState<"mobile" | "laptop">("mobile");
  const isDark = theme === "dark";

  const cardProps = useMemo(
    () => ({
      name,
      description,
      logoUrl,
      backgroundUrl,
      contactEmail,
    }),
    [name, description, logoUrl, backgroundUrl, contactEmail],
  );

  const deviceFrameClass = useMemo(
    () =>
      cn(
        "w-full transition-all duration-300",
        device === "mobile" ? "mx-auto max-w-[375px]" : "mx-auto max-w-[960px]",
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
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={cn(
          "max-h-[min(90vh,900px)] max-w-[min(100vw-2rem,1024px)] gap-4 overflow-y-auto p-6",
          isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50 text-zinc-900",
        )}
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle
            className={cn("font-semibold", isDark ? "text-zinc-100" : "text-zinc-900")}
          >
            {t("Preview")}
          </DialogTitle>
        </DialogHeader>

        <div>
          <span
            className={cn(
              "mb-3 block text-sm font-medium",
              isDark ? "text-zinc-400" : "text-zinc-600",
            )}
          >
            {t("Device")}
          </span>
          <RadioGroup
            value={device}
            onValueChange={handleDeviceChange}
            className="flex flex-row flex-wrap gap-4"
          >
            {deviceOptions.map((option) => (
              <label
                key={option.value}
                htmlFor={`preview-org-device-${option.value}`}
                className={cn(
                  "flex min-w-[140px] flex-1 cursor-pointer items-center justify-center gap-3 rounded-lg border p-3 transition-colors",
                  device === option.value
                    ? "border-button-accent bg-button-accent/10"
                    : isDark
                      ? "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                      : "border-zinc-200 bg-white hover:border-zinc-300",
                )}
              >
                <RadioGroupItem
                  value={option.value}
                  id={`preview-org-device-${option.value}`}
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
      </DialogContent>
    </Dialog>
  );
});

export default PreviewOrganizationPopover;
