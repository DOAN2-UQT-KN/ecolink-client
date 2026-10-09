import { STATUS } from "@/constants/status";
import { STATUS_LABEL, statusTone } from "@/constants/statusTone";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { Pill } from "./Pill";

interface StatusPillProps extends Omit<ComponentProps<typeof Pill>, "tone" | "children" | "type"> {
  type: STATUS | number;
}

/** Read-only status pill. Kept free of antd so list cards stay light; `ChangeStatus` adds the dropdown. */
// Forwards ref and DOM props: antd Dropdown attaches its hover trigger to this element.
export function StatusPill({ type, ...props }: StatusPillProps) {
  const { t } = useTranslation();
  const label = STATUS_LABEL[type as STATUS];
  return (
    <Pill tone={statusTone(type)} {...props}>
      {label ? t(label) : ""}
    </Pill>
  );
}

export default StatusPill;
