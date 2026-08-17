import React, { memo, useMemo } from "react";
import { PiTrash, PiSkullLight, PiClock } from "react-icons/pi";
import { useTranslation } from "react-i18next";

const CONDITION_LABELS: Record<string, string> = {
  "newly-appeared": "Newly-appeared",
  "long-standing": "Long-standing",
  reappeared: "Previously cleaned but reappeared",
};

interface ReportFooterProps {
  wasteType?: string | null;
  condition?: string | null;
  severityLevel?: string | number | null;
}

export const ReportFooter = memo(function ReportFooter({
  wasteType,
  condition,
  severityLevel,
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
        icon: <PiClock size={18} />,
        label: t("Condition"),
        value: condition
          ? t(CONDITION_LABELS[condition] || condition)
          : t("N/A"),
      },
      {
        icon: <PiSkullLight size={18} />,
        label: t("Severity"),
        value: severityLevel ?? t("N/A"),
      },
    ],
    [t, wasteType, condition, severityLevel],
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-4 border-y border-border/50 my-4">
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
