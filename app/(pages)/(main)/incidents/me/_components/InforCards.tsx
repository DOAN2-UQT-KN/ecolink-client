import { memo, useContext } from "react";
import StatsCard from "@/components/shared/StatsCard";
import {
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from "react-icons/hi";
import { IncidentMeContext } from "../_context/IncidentMeContext";
import { STATUS } from "@/constants/status";
import { useTranslation } from "react-i18next";

const InforCards = memo(function InforCards() {
  const { t } = useTranslation();
  const context = useContext(IncidentMeContext);
  const reports = context?.reports || [];

  const totalIncidents = reports.length;
  
  const resolvedCount = reports.filter(
    (report) => 
      report.status === STATUS.COMPLETED || 
      report.status === STATUS.APPROVED || 
      report.status === STATUS.CLOSED
  ).length;

  const pendingCount = totalIncidents - resolvedCount;

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between w-full gap-5">
      <StatsCard
        title={t("Total Incidents")}
        value={totalIncidents}
        description={t("All incidents reported")}
        icon={
          <HiOutlineDocumentText size={22} className="text-button-accent" />
        }
      />
      <StatsCard
        title={t("Resolved")}
        value={resolvedCount}
        description={t("Incidents marked as resolved")}
        icon={<HiOutlineCheckCircle size={22} className="text-button-accent" />}
      />
      <StatsCard
        title={t("Pending")}
        value={pendingCount}
        description={t("Incidents awaiting action")}
        icon={<HiOutlineClock size={22} className="text-button-accent" />}
      />
    </div>
  );
});

export default InforCards;
