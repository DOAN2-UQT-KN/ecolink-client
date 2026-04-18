"use client";

import { memo, useCallback, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import OrganizationCard from "@/modules/OrganizationCard/OrganizationCard";
import type { IIncident } from "@/apis/incident/models/incident";
import AddressDisplay from "@/app/(pages)/(main)/incidents/me/_components/AddressDisplay";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/libs/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type BasePreview = {
  /** Matches admin DataTable / layout; defaults to dark. */
  theme?: "light" | "dark";
  trigger: ReactNode;
};

export type PreviewIncidentPopoverProps =
  | (BasePreview & {
      incident: IIncident;
      name?: never;
      description?: never;
      logoUrl?: never;
      backgroundUrl?: never;
      contactEmail?: never;
    })
  | (BasePreview & {
      incident?: never;
      name: string;
      description: string;
      logoUrl: string;
      backgroundUrl: string;
      contactEmail: string;
    });

export const PreviewIncidentPopover = memo(function PreviewIncidentPopover(
  props: PreviewIncidentPopoverProps,
) {
  const { t } = useTranslation();
  const [device, setDevice] = useState<"mobile" | "laptop">("mobile");
  const theme = props.theme ?? "dark";
  const isDark = theme === "dark";

  const isIncidentPreview = "incident" in props && props.incident != null;

  const orgCardProps = useMemo(() => {
    if ("incident" in props && props.incident) return null;
    return {
      name: props.name,
      description: props.description,
      logoUrl: props.logoUrl,
      backgroundUrl: props.backgroundUrl,
      contactEmail: props.contactEmail,
    };
  }, [props]);

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

  const incident = isIncidentPreview ? props.incident : null;

  return (
    <Dialog>
      <DialogTrigger asChild>{props.trigger}</DialogTrigger>
      <DialogContent
        className={cn(
          "max-h-[min(90vh,900px)] max-w-[min(100vw-2rem,1024px)] overflow-y-auto gap-4 p-6",
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
                htmlFor={`preview-incident-device-${option.value}`}
                className={cn(
                  "flex min-w-[140px] flex-1 cursor-pointer items-center justify-center gap-3 rounded-lg border p-3 transition-colors",
                  device === option.value
                    ? "bg-button-accent/10 border-button-accent"
                    : isDark
                      ? "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                      : "border-zinc-200 bg-white hover:border-zinc-300",
                )}
              >
                <RadioGroupItem
                  value={option.value}
                  id={`preview-incident-device-${option.value}`}
                />
                <span className="text-sm font-normal">{option.label}</span>
              </label>
            ))}
          </RadioGroup>
        </div>

        <div className={deviceFrameClass}>
          <div className={bezelClass}>
            {incident ? (
              <div
                className={cn(
                  "space-y-4 rounded-xl bg-white p-4 text-zinc-900",
                  isDark && "bg-zinc-950 text-zinc-100",
                )}
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-200">
                  {incident.media_files?.[0]?.url ? (
                    <Image
                      src={incident.media_files[0].url}
                      alt={incident.title || t("Untitled Incident")}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 960px"
                    />
                  ) : (
                    <div className="flex h-full min-h-[160px] items-center justify-center text-sm text-zinc-500">
                      {t("No image")}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {incident.title || t("Untitled Incident")}
                  </h3>
                  {incident.description ? (
                    <p
                      className={cn(
                        "mt-2 text-sm",
                        isDark ? "text-zinc-400" : "text-zinc-600",
                      )}
                    >
                      {incident.description}
                    </p>
                  ) : null}
                </div>
                <div className={cn("text-xs", isDark ? "text-zinc-400" : "text-zinc-600")}>
                  <AddressDisplay
                    latitude={incident.latitude}
                    longitude={incident.longitude}
                    address={incident.detail_address}
                  />
                </div>
                <dl
                  className={cn(
                    "grid grid-cols-1 gap-2 text-xs sm:grid-cols-2",
                    isDark ? "text-zinc-200" : "text-zinc-800",
                  )}
                >
                  <div>
                    <dt className={cn(isDark ? "text-zinc-500" : "text-zinc-500")}>{t("Created")}</dt>
                    <dd>{incident.created_at ? new Date(incident.created_at).toLocaleString() : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">{t("Updated")}</dt>
                    <dd>{incident.updated_at ? new Date(incident.updated_at).toLocaleString() : "—"}</dd>
                  </div>
                  {incident.waste_type ? (
                    <div>
                      <dt className="text-zinc-500">{t("Waste type")}</dt>
                      <dd>{incident.waste_type}</dd>
                    </div>
                  ) : null}
                  {incident.severity_level != null ? (
                    <div>
                      <dt className="text-zinc-500">{t("Severity")}</dt>
                      <dd>{incident.severity_level}</dd>
                    </div>
                  ) : null}
                  {incident.latitude != null && incident.longitude != null ? (
                    <div className="sm:col-span-2">
                      <dt className="text-zinc-500">{t("Coordinates")}</dt>
                      <dd>
                        {incident.latitude}, {incident.longitude}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ) : orgCardProps ? (
              <OrganizationCard {...orgCardProps} />
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default PreviewIncidentPopover;
