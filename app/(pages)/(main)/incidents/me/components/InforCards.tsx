import { memo } from "react";
import StatsCard from "@/components/shared/StatsCard";
import {
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from "react-icons/hi";

const InforCards = memo(function InforCards() {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between w-full gap-5">
      <StatsCard
        title="Total Incidents"
        value={12}
        description="All incidents reported"
        icon={
          <HiOutlineDocumentText size={22} className="text-button-accent" />
        }
      />
      <StatsCard
        title="Resolved"
        value={8}
        description="Incidents marked as resolved"
        icon={<HiOutlineCheckCircle size={22} className="text-button-accent" />}
      />
      <StatsCard
        title="Pending"
        value={4}
        description="Incidents awaiting action"
        icon={<HiOutlineClock size={22} className="text-button-accent" />}
      />
    </div>
  );
});

export default InforCards;
