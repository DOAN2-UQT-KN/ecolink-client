import { memo } from "react";
import { useCompletionReview } from "@/apis/campaign/processCampaign";
import type { ICampaign } from "@/apis/campaign/models/campaign";
import { ShiftProgressCard } from "@/modules/CampaignVerification";
import { Skeleton } from "@/components/ui/skeleton";
import { CompletionEvidence } from "../completion/CompletionEvidence";

/** Result tab: the completion evidence once marked done, then the shift grid (each shift's popover is the campaign page's). */
export const CampaignResult = memo(function CampaignResult({
  campaign,
  isDark,
}: {
  campaign: ICampaign;
  isDark: boolean;
}) {
  const submitted = Boolean(campaign.completion_submitted_at);
  const { data, isLoading } = useCompletionReview(campaign.id, { enabled: submitted });
  const review = data?.data;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {submitted &&
        (isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : review ? (
          <CompletionEvidence review={review} isDark={isDark} />
        ) : null)}
      {/* Once marked done the summary above has the totals: the shift grid alone, folded. */}
      <ShiftProgressCard
        campaign={campaign}
        variant="admin"
        isDark={isDark}
        hideStats={submitted}
        defaultOpen={!submitted}
      />
    </div>
  );
});
