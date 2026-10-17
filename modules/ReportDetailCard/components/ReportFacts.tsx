import { memo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { IconType } from "react-icons";
import { TbAlertTriangle, TbBuildingCommunity, TbCategory, TbProgress, TbTrash } from "react-icons/tb";
import type { IIncident } from "@/apis/incident/models/incident";
import { StatusTag } from "@/components/ui/StatusTag";
import { reportCategoryLabel, WASTE_TYPES } from "@/constants/reportVerification";
import { getSeverityLevel } from "@/constants/severity";
import { Link } from "@/libs/router";
import { cn } from "@/libs/utils";
import { getWasteTypeLabels } from "@/modules/ReportGeneralInformation";

/**
 * Category, waste types, severity, status and handling organization of a report (specs/010 US1),
 * laid out like the former ReportFooter: icon + small label + value. Missing values are left out;
 * the status tag is the only coloured element. `compact` drops the organization.
 */
export const ReportFacts = memo(function ReportFacts({
  incident,
  compact = false,
}: {
  incident: IIncident;
  compact?: boolean;
}) {
  const { t } = useTranslation();

  const wasteTypes = incident.waste_types?.length
    ? incident.waste_types.map((v) => t(WASTE_TYPES.find((w) => w.value === v)?.label ?? v))
    : getWasteTypeLabels(incident.waste_type, t);
  const severity = getSeverityLevel(incident.severity_level);
  const handledBy = compact ? null : incident.handled_by;

  const items: { label: string; icon: IconType; value: ReactNode }[] = [];
  if (incident.category) {
    items.push({
      label: t("Category"),
      icon: TbCategory,
      value: t(reportCategoryLabel(incident.category) ?? incident.category),
    });
  }
  if (wasteTypes.length > 0) items.push({ label: t("Waste type"), icon: TbTrash, value: wasteTypes.join(", ") });
  if (severity) items.push({ label: t("Severity"), icon: TbAlertTriangle, value: t(severity.label) });
  items.push({ label: t("Status"), icon: TbProgress, value: <StatusTag status={incident.status} /> });
  if (handledBy) {
    items.push({
      label: t("Handled by"),
      icon: TbBuildingCommunity,
      value: (
        <Link
          href={`/organizations/${handledBy.slug ?? handledBy.id}`}
          className="font-medium text-foreground-primary hover:underline"
        >
          {handledBy.name}
        </Link>
      ),
    });
  }

  return (
    <div
      className={cn(
        "grid gap-3 border-y border-border/50 py-4",
        compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2",
      )}
    >
      {items.map(({ label, icon: Icon, value }) => (
        <div key={label} className="flex min-w-0 items-center gap-2.5">
          <div className="rounded-lg p-2 text-foreground-secondary">
            <Icon aria-hidden size={18} />
          </div>
          <div className="flex min-w-0 flex-col items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-tertiary">{label}</span>
            <span className="font-display-1 whitespace-normal text-foreground-secondary">{value}</span>
          </div>
        </div>
      ))}
    </div>
  );
});
