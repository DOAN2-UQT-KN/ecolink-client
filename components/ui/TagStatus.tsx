import React from "react";
import { useTranslation } from "react-i18next";

import { STATUS } from "@/constants/status";
import { STATUS_LABEL, statusTone } from "@/constants/statusTone";
import { Pill } from "./Pill";

interface TagStatusProps {
  type: number;
  className?: string;
  label?: string;
  isDark?: boolean;
}

/** Tag of a numeric `STATUS`: colour from `STATUS_TONE`, label from `STATUS_LABEL`. */
const TagStatus: React.FC<TagStatusProps> = ({ type, className, label, isDark }) => {
  const { t } = useTranslation();
  if (!type) return null;
  const fallback = STATUS_LABEL[type as STATUS];

  return (
    <Pill tone={statusTone(type)} isDark={isDark} className={className}>
      {label ?? (fallback ? t(fallback) : "")}
    </Pill>
  );
};

export default TagStatus;
