"use client";

import React, { memo, useMemo, useState } from "react";
import { IIncident } from "@/apis/incident/models/incident";
import { ReportHeader } from "./components/ReportHeader";
import { ReportContent } from "./components/ReportContent";
import { ReportFooter } from "./components/ReportFooter";
import { ReportActions } from "./components/ReportActions";
import { cn } from "@/libs/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface ReportDetailCardProps {
  incident: IIncident;
  className?: string;
  isExpanded?: boolean;
  /** When false, omits vote/share footer and hides the save control in the header. */
  showAction?: boolean;
  /** When the card is expanded inside a dialog, parent passes this so preview state syncs with the dialog shell. */
  onPreviewOpenChange?: (open: boolean) => void;
}

const ReportDetailCard = memo(function ReportDetailCard({
  incident,
  className,
  isExpanded = false,
  showAction = true,
  onPreviewOpenChange,
}: ReportDetailCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const handlePreviewOpenChange = onPreviewOpenChange ?? setIsPreviewOpen;

  const images = useMemo(
    () => incident?.image_urls || incident?.media_files?.map((m) => m.url) || [],
    [incident],
  );

  if (!incident) return null;


  const content = useMemo(
    () => (
      <article
        className={cn(
          "flex flex-col w-full mx-auto border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5 overflow-hidden transition-all duration-300",
          !isExpanded && "max-w-2xl hover:shadow-md cursor-pointer",
          isExpanded &&
            "max-w-none border-none shadow-none bg-transparent h-full",
          className,
        )}
      >
        <div
          className={cn(
            "p-4 md:p-5 flex flex-col",
            isExpanded ? "gap-6 h-full overflow-y-auto" : "h-full",
          )}
        >
          <ReportHeader
            reportId={incident.id}
            user={incident.user}
            createdAt={incident.created_at}
            isSaved={incident.saved}
            showAction={showAction}
          />

          <ReportContent
            title={incident.title}
            address={incident.detail_address || null}
            description={incident.description}
            aiRecommendation={incident.ai_recommendation ?? null}
            images={images}
            isExpanded={isExpanded}
            onPreviewOpenChange={handlePreviewOpenChange}
          />

          <ReportFooter
            wasteType={incident.waste_type}
            size={incident.size}
            condition={incident.condition}
            pollutionLevel={incident.severity_level}
            isExpanded={isExpanded}
          />

          {showAction ? (
            <ReportActions
              reportId={incident.id}
              initialVotePoint={
                (incident.votes?.upvote_count || 0) -
                (incident.votes?.downvote_count || 0)
              }
              initialUserVote={incident.votes?.my_vote || null}
            />
          ) : null}
        </div>
      </article>
    ),
    [className, handlePreviewOpenChange, images, incident, isExpanded, showAction],
  );


  if (isExpanded) {
    return content;
  }
  // useEffect(() => {
  //   const handler = (e: Event) => {
  //     const target = e.target as HTMLElement;
  
  //     if (target.closest('.ant-image-preview-root')) {
  //       console.log("clicked inside preview");
  //       e.stopPropagation();
  //     }
  //   };
  
  //   document.addEventListener('pointerdown', handler, true);
  
  //   return () => {
  //     document.removeEventListener('pointerdown', handler, true);
  //   };
  // }, []);
  const [open, setOpen] = useState(false);
  console.log("isPreviewOpen", isPreviewOpen);
  return (
    <Dialog open={open}  
      onOpenChange={(next) => {
        if (isPreviewOpen) {
          console.log("isPreviewOpen", isPreviewOpen);
          console.log("next", next);
          if (next == false) {
            setOpen(true);
          
          }
          else
          return;
        }
        else {
          setOpen(next);
        }
      }}>
      <DialogTrigger asChild>
        <div
          // onClick={(e) => {
          //   if (isPreviewOpen) {
          //     e.preventDefault();
          //     e.stopPropagation();
          //   }
          // }}
        >
          {content}
        </div>
      </DialogTrigger>
      <DialogContent
        className="max-w-[95vw] md:max-w-5xl w-full h-[90vh] md:h-[85vh] p-0 overflow-hidden border-none bg-white/95 backdrop-blur-md"
      >
        <ReportDetailCard
          incident={incident}
          isExpanded={true}
          showAction={showAction}
          onPreviewOpenChange={setIsPreviewOpen}
        />
      </DialogContent>
    </Dialog>
  );
});


export default ReportDetailCard;
