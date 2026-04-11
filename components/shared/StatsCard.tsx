"use client";

import { useTranslation } from "react-i18next";

type StatsCardProps = {
  title: string;
  value: number | string;
  description: string;
  icon?: React.ReactNode;
};

export default function StatsCard({
  title,
  value,
  description,
  icon,
}: StatsCardProps) {
  const { t } = useTranslation("common");

  return (
    <div className="rounded-2xl border border-[#887a47]/50 bg-white p-5 shadow-sm w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-[35px] h-[35px] rounded-[7px] border border-[#665814]/30 bg-white">
          {icon}
        </div>
        <span className="text-button-accent font-semibold font-display-4">
          {t(title)}
        </span>
      </div>

      {/* Value */}
      <div
        className="font-display-10 font-semibold text-button-accent mb-2
      "
      >
        {value}
      </div>

      {/* Description */}
      <p className="font-display-1 text-button-accent-hover">
        {t(description)}
      </p>
    </div>
  );
}
