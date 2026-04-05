import { memo } from "react";
import StatsCard from "@/components/shared/StatsCard";
import {
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlinePencil,
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
  // const { data: draftData } = useGetMyReports({
  //   limit: 1,
  //   status: STATUS.DRAFT,
  // });

  const totalIncidents = totalData?.data?.total || 0;
  const resolvedCount = resolvedData?.data?.total || 0;
  const pendingCount = pendingData?.data?.total || 0;
  // const draftCount = draftData?.data?.total || 0;

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
      {/* <StatsCard
        title={t("Draft")}
        value={draftCount}
        description={t("Incidents in draft")}
        icon={<HiOutlinePencil size={22} className="text-button-accent" />}
      /> */}
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
