"use client";

import React, { memo, useMemo } from "react";
import {
  PiTrash,
  PiArrowsOutSimple,
  PiSealWarningLight,
  PiSkullLight,
} from "react-icons/pi";
import { useTranslation } from "react-i18next";
import { cn } from "@/libs/utils";

interface ReportFooterProps {
  wasteType?: string | null;
  size?: string | number | null;
  condition?: string | null;
  pollutionLevel?: string | number | null;
  isExpanded?: boolean;
}

export const ReportFooter = memo(function ReportFooter({
  wasteType,
  size,
  condition,
  pollutionLevel,
  isExpanded = false,
}: ReportFooterProps) {
  const { t } = useTranslation();

  const items = useMemo(
    () => [
      {
        icon: <PiTrash size={18} />,
        label: t("Waste Type"),
        value: wasteType || t("N/A"),
      },
      {
        icon: <PiArrowsOutSimple size={18} />,
        label: t("Size"),
        value: size || t("N/A"),
      },
      {
        icon: <PiSealWarningLight size={18} />,
        label: t("Condition"),
        value: condition || t("N/A"),
      },
      {
        icon: <PiSkullLight size={18} />,
        label: t("Pollution Level"),
        value: pollutionLevel || t("N/A"),
      },
    ],
    [t, wasteType, size, condition, pollutionLevel],
  );

  return (
    <div
      className={cn(
        "grid gap-3 py-4 border-y border-border/50 my-4",
        isExpanded ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2",
      )}
    >
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg`}>{item.icon}</div>
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
  );
});

