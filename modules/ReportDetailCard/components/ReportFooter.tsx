"use client";

import React from "react";
import {
  PiTrash,
  PiArrowsOutSimple,
  PiSealWarningLight,
  PiSkullLight,
} from "react-icons/pi";
import { useTranslation } from "react-i18next";

interface ReportFooterProps {
  wasteType?: string | null;
  size?: string | number | null;
  condition?: string | null;
  pollutionLevel?: string | number | null;
}

export const ReportFooter: React.FC<ReportFooterProps> = ({
  wasteType,
  size,
  condition,
  pollutionLevel,
}) => {
  const { t } = useTranslation();

  const items = [
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
  ];

  return (
    <div className="grid grid-cols-2 gap-3 py-4 border-y border-border/50 my-4">
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
};
