import React, { memo, useMemo } from "react";
import { IIncident } from "@/apis/incident/models/incident";
import { ReportHeader } from "./components/ReportHeader";
import { ReportContent } from "./components/ReportContent";
import { ReportFacts } from "./components/ReportFacts";
import { ReportActions } from "./components/ReportActions";
import { cn } from "@/libs/utils";
import { useLocalizedDisplay } from "@/hooks/useLocalizedDisplay";
import { useRouter } from "@/libs/router";
import { openReportOnCardClick } from "./reportCardNavigation";

interface ReportDetailCardProps {
  incident: IIncident;
  className?: string;
  /** Full description and the AI recommendation (the report detail page). */
  isExpanded?: boolean;
  /** When false, omits vote/share footer and hides the save control in the header. */
  showAction?: boolean;
  /** Clicking the card opens the report detail page (specs/009 FR-017). Off on that page itself. */
  linkToDetail?: boolean;
}

const ReportDetailCard = memo(function ReportDetailCard({
  incident,
  className,
  isExpanded = false,
  showAction = true,
  linkToDetail = true,
}: ReportDetailCardProps) {
  const router = useRouter();
  const { title: localizedTitle, description: localizedDescription } =
    useLocalizedDisplay();

  const images = useMemo(
    () => incident?.image_urls || incident?.media_files?.map((m) => m.url) || [],
    [incident],
  );

  if (!incident) return null;

  const href = linkToDetail ? `/incidents/${incident.id}` : undefined;
  const onCardClick = href
    ? (e: React.MouseEvent) => openReportOnCardClick(e, href, (to) => router.push(to))
    : undefined;

  return (
    <article
      onClick={onCardClick}
      onAuxClick={onCardClick}
      className={cn(
        "flex flex-col mx-auto w-full max-w-2xl border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5 overflow-hidden transition-all duration-300",
        href && "hover:shadow-md cursor-pointer",
        className,
      )}
    >
      <div className={cn("p-4 md:p-5 flex flex-col h-full")}>
        <ReportHeader
          reportId={incident.id}
          user={incident.user}
          createdAt={incident.created_at}
          isSaved={incident.saved}
          showAction={showAction}
        />

        <ReportContent
          title={localizedTitle(incident) || incident.title}
          href={href}
          address={incident.detail_address || null}
          description={localizedDescription(incident) || incident.description}
          aiRecommendation={incident.ai_recommendation ?? null}
          images={images}
          isExpanded={isExpanded}
        />

        <div className="my-4">
          <ReportFacts incident={incident} />
        </div>

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
  );
});

export default ReportDetailCard;
