import { memo, useContext, useMemo } from "react";
import StatsCard from "@/components/shared/StatsCard";
import {
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from "react-icons/hi";
import { IncidentMeContext } from "../_context/IncidentMeContext";
import { useTranslation } from "react-i18next";
import { calculateIncidentStats } from "../_services/stats.service";

const StatsCards = memo(function StatsCards() {
  const { t } = useTranslation();
  const context = useContext(IncidentMeContext);
  const reports = context?.reports || [];

  const stats = useMemo(() => calculateIncidentStats(reports), [reports]);

  const { total: totalIncidents, resolved: resolvedCount, pending: pendingCount } = stats;

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

export default StatsCards;
