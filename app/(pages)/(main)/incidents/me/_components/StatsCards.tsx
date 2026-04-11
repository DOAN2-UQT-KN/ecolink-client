import { memo, useMemo } from "react";
import StatsCard from "@/components/shared/StatsCard";
import {
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from "react-icons/hi";
import { useTranslation } from "react-i18next";
import { useGetMyReports } from "@/apis/incident/getReport";
import { STATUS } from "@/constants/status";

const StatsCards = memo(function StatsCards() {
  const { t } = useTranslation();

  const { data: totalData } = useGetMyReports({ limit: 1 });
  const { data: resolvedData } = useGetMyReports({
    limit: 1,
    status: STATUS.COMPLETED,
  });
  const { data: pendingData } = useGetMyReports({
    limit: 1,
    status: STATUS.PENDING,
  });

  const totalIncidents = useMemo(() => totalData?.data?.total || 0, [
    totalData,
  ]);
  const resolvedCount = useMemo(() => resolvedData?.data?.total || 0, [
    resolvedData,
  ]);
  const pendingCount = useMemo(() => pendingData?.data?.total || 0, [
    pendingData,
  ]);

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
