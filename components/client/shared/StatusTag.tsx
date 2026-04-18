"use client";

import React from "react";
import {
  PiCircleHalfFill,
  PiCheckCircleFill,
  PiCircleDashed,
} from "react-icons/pi";
import { STATUS } from "@/constants/status";
import { useTranslation } from "react-i18next";

interface StatusTagProps {
  status: STATUS;
  className?: string;
}

export const StatusTag: React.FC<StatusTagProps> = ({
  status,
  className = "",
}) => {
  const { t } = useTranslation();

  const getStatusConfig = (status: STATUS) => {
    // Specifically handle the requested statuses
    if (status === STATUS.DRAFT) {
      return {
        icon: <PiCircleDashed size={24} />,
        label: t("DRAFT"),
        colorClass: "text-black",
      };
    }

    // Group all pending/waiting statuses as PENDING
    if (
      status === STATUS.PENDING ||
      status === STATUS.NEW ||
      status === STATUS.WAITING_APPROVED ||
      status === STATUS.WAITING_CONFIRMED ||
      status === STATUS.INREVIEW ||
      status === STATUS.IN_PROGRESS
    ) {
      return {
        icon: <PiCircleHalfFill size={24} />,
        label: t("In progress"),
        colorClass: "text-blue-500",
      };
    }

    // Group all completed/approved statuses as COMPLETED
    if (
      status === STATUS.COMPLETED ||
      status === STATUS.APPROVED ||
      status === STATUS.VERIFIED ||
      status === STATUS.CLOSED ||
      status === STATUS.CONFIRMED
    ) {
      return {
        icon: <PiCheckCircleFill size={24} />,
        label: t("Completed"),
        colorClass: "text-green-500",
      };
    }

    // Default fallback (though we should avoid it)
    return {
      icon: <PiCircleDashed size={24} />,
      label: t("Unknown"),
      colorClass: "text-muted-foreground",
    };
  };

  const config = getStatusConfig(status);

  return (
    <div
      className={`flex items-center gap-2 ${config.colorClass} ${className} w-fit`}
    >
      <div className="flex-shrink-0">{config.icon}</div>
      <span className="font-display-1">{config.label}</span>
    </div>
  );
};
