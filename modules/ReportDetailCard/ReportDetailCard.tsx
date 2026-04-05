"use client";

import React from "react";
import { IIncident } from "@/apis/incident/models/incident";
import { ReportHeader } from "./components/ReportHeader";
import { ReportContent } from "./components/ReportContent";
import { ReportFooter } from "./components/ReportFooter";
import { ReportActions } from "./components/ReportActions";
import { cn } from "@/libs/utils";

interface ReportDetailCardProps {
  incident: IIncident;
  className?: string;
}

const ReportDetailCard: React.FC<ReportDetailCardProps> = ({
  incident,
  className,
}) => {
  if (!incident) return null;

  // Extract images from image_urls or media_files
  const images =
    incident.image_urls || incident.media_files?.map((m) => m.url) || [];

  return (
    <article
      className={cn(
        "flex flex-col w-full max-w-2xl mx-auto bg-card rounded-[15px] border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300",
        className,
      )}
    >
      <div className="p-4 md:p-5 flex flex-col h-full">
        <ReportHeader user={incident.user} createdAt={incident.created_at} />

        <ReportContent
          title={incident.title}
          address={incident.detail_address || null}
          description={incident.description}
          images={images}
        />

        <ReportFooter
          wasteType={incident.waste_type}
          size={incident.size}
          condition={incident.condition}
          pollutionLevel={incident.severity_level}
        />

        <ReportActions
          reportId={incident.id}
          initialVotePoint={incident.vote_point || 0}
        />
      </div>
    </article>
  );
};

export default ReportDetailCard;
