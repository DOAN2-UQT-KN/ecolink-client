"use client";

import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Image from "next/image";

import { IIncident } from "@/apis/incident/models/incident";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/libs/utils";

interface ReportSummaryCardProps {
  incident: IIncident;
  selectedReports: IIncident[];
  setSelectedReports: (reports: IIncident[]) => void;
}

const ReportSummaryCard = memo(function ReportSummaryCard({
  incident,
  selectedReports,
  setSelectedReports,
}: ReportSummaryCardProps) {
  const { t } = useTranslation();

  const isChecked = useMemo(
    () => selectedReports.some((report) => report.id === incident.id),
    [incident.id, selectedReports],
  );

  const imageUrl = useMemo(
    () => incident.image_urls?.[0] ?? incident.media_files?.[0]?.url ?? null,
    [incident.image_urls, incident.media_files],
  );

  const toggleSelected = useCallback(() => {
    if (isChecked) {
      setSelectedReports(
        selectedReports.filter((report) => report.id !== incident.id),
      );
      return;
    }
    setSelectedReports([...selectedReports, incident]);
  }, [incident, isChecked, selectedReports, setSelectedReports]);

  return (
    <div
      className={cn(
        "relative w-full border rounded-[10px] bg-white/90 transition-colors",
        "border-[rgba(136,122,71,0.4)] p-4",
        isChecked ? "ring-2 ring-button-accent/35" : "hover:bg-white",
      )}
    >
      <div className="absolute left-3 top-3 z-10">
        <Checkbox checked={isChecked} onCheckedChange={toggleSelected} />
      </div>
      <div className="pl-7 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h4 className="font-semibold text-foreground line-clamp-2">
            {incident.title || t("Untitled report")}
          </h4>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {incident.description || t("No description provided.")}
        </p>
        {imageUrl ? (
          <div className="relative w-full h-[150px] rounded-[8px] overflow-hidden">
            <Image
              src={imageUrl}
              alt={incident.title || t("Report image")}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
});

export default ReportSummaryCard;
