"use client";

import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineArchive, HiOutlineClock, HiOutlineUserGroup } from "react-icons/hi";

import StatsCard from "@/components/client/shared/StatsCard";

import { useCampaignDetail } from "../_hooks/useCampaignDetail";

const StatsCards = memo(function StatsCards() {
  const { t } = useTranslation();
  const { currentMembers, daysSinceStart, archivedTasksCount } =
    useCampaignDetail();

  const daysLabel = useMemo(() => {
    if (daysSinceStart === null) return "—";
    return String(daysSinceStart);
  }, [daysSinceStart]);

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between w-full gap-5">
      <StatsCard
        title={t("Volunteers")}
        value={currentMembers}
        description={t("Current campaign members")}
        icon={<HiOutlineUserGroup size={22} className="text-button-accent" />}
      />
      <StatsCard
        title={t("Days since start")}
        value={daysLabel}
        description={t("From campaign start date to today")}
        icon={<HiOutlineClock size={22} className="text-button-accent" />}
      />
      <StatsCard
        title={t("Archived tasks")}
        value={archivedTasksCount}
        description={t("Completed and archived work items")}
        icon={<HiOutlineArchive size={22} className="text-button-accent" />}
      />
    </div>
  );
});

export default StatsCards;
