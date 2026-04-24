"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiMapPin } from "react-icons/hi2";
import {
  PiArrowsOutSimple,
  PiSealWarningLight,
  PiShareNetwork,
  PiSkullLight,
  PiTrash,
} from "react-icons/pi";
import { TbArrowBigDown, TbArrowBigUp } from "react-icons/tb";

import { IIncident } from "@/apis/incident/models/incident";
import ReportDetailCard from "@/modules/ReportDetailCard/ReportDetailCard";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
  const [isOpen, setIsOpen] = useState(false);

  const isChecked = useMemo(
    () => selectedReports.some((report) => report.id === incident.id),
    [incident.id, selectedReports],
  );

  const votePoint = useMemo(
    () => (incident.votes?.upvote_count || 0) - (incident.votes?.downvote_count || 0),
    [incident.votes?.downvote_count, incident.votes?.upvote_count],
  );

  const footerItems = useMemo(
    () => [
      {
        icon: <PiTrash size={18} />,
        label: t("Waste Type"),
        value: incident.waste_type || t("N/A"),
      },
      {
        icon: <PiArrowsOutSimple size={18} />,
        label: t("Size"),
        value: incident.size || t("N/A"),
      },
      {
        icon: <PiSealWarningLight size={18} />,
        label: t("Condition"),
        value: incident.condition || t("N/A"),
      },
      {
        icon: <PiSkullLight size={18} />,
        label: t("Pollution Level"),
        value: incident.severity_level || t("N/A"),
      },
    ],
    [
      incident.condition,
      incident.severity_level,
      incident.size,
      incident.waste_type,
      t,
    ],
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

  const stopOpenDialog = useCallback((e: React.SyntheticEvent<HTMLDivElement>) => {
    e.stopPropagation();
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div
          className={cn(
            "relative w-full border rounded-[10px] bg-white/90 transition-colors cursor-pointer",
            "border-[rgba(136,122,71,0.4)] p-4",
            isChecked ? "ring-2 ring-button-accent/35" : "hover:bg-white",
          )}
        >
          <div
            className="absolute left-3 top-3 z-10"
            onClick={stopOpenDialog}
            onPointerDown={stopOpenDialog}
          >
            <Checkbox checked={isChecked} onCheckedChange={toggleSelected} />
          </div>
          <div className="pl-7 flex flex-col gap-3">
            <div className="space-y-1">
              <h4 className="font-semibold text-black leading-tight line-clamp-2">
                {incident.title || t("Untitled report")}
              </h4>
              {incident.detail_address && (
                <div className="flex items-center gap-2 font-display-1 text-foreground-tertiary">
                  <HiMapPin size={14} />
                  <p className="line-clamp-1">{incident.detail_address}</p>
                </div>
              )}
            </div>
            <p className="font-display-2 text-foreground-secondary leading-relaxed line-clamp-2 max-h-[100px] overflow-y-auto scrollbar-hide">
              {incident.description || t("No description provided.")}
            </p>

            <div className="grid grid-cols-2 grid-rows-2 gap-3 py-3 border-y border-border/50">
              {footerItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg">{item.icon}</div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-foreground-tertiary">
                      {item.label}
                    </span>
                    <span className="font-display-1 truncate text-foreground-secondary capitalize">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center h-10 px-4 bg-muted/60 dark:bg-accent/30 rounded-full transition-all">
                <span className="font-display-1 text-foreground-secondary">{t("Vote point")}</span>
                <span className="mx-2 font-display-2 font-semibold text-foreground min-w-[20px] text-center">
                  {votePoint}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] md:max-w-5xl w-full h-[90vh] md:h-[85vh] p-0 overflow-hidden border-none bg-white/95 backdrop-blur-md">
        <ReportDetailCard incident={incident} isExpanded showAction />
      </DialogContent>
    </Dialog>
  );
});

export default ReportSummaryCard;
