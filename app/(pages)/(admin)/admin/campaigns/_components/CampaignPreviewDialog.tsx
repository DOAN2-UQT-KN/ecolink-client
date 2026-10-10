import { useTranslation } from "react-i18next";
import { TbExternalLink } from "react-icons/tb";
import { useGetCampaignById } from "@/apis/campaign/getCampaignById";
import { useGetCampaignHistory } from "@/apis/campaign/getCampaignHistory";
import { CAMPAIGN_STATUS } from "@/constants/campaignLifecycle";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";
import { impliedMinAge } from "@/constants/campaignLifecycle";
import { OrganizationIdentity } from "@/components/admin/shared/OrganizationIdentity";
import { ReviewRow, ReviewSectionCard } from "@/components/ui/ReviewSection";
import Image from "@/components/ui/AppImage";
import { Button } from "@/components/ui/button";
import { CampaignStatusTag } from "@/components/ui/CampaignStatusTag";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CAMPAIGN_PUBLIC_STATUSES } from "@/constants/campaignLifecycle";
import { getDifficultyLevel } from "@/constants/difficulty";
import { useLocalizedDisplay } from "@/hooks/useLocalizedDisplay";
import { cn } from "@/libs/utils";
import { formattedDate } from "@/utils/formattedDate";
import { CampaignDateRange } from "@/components/client/shared/CampaignDateRange";
import { CHANGE_LABELS, RESULT_STATUSES, STOPPED_STATUSES } from "../_services/campaignPreview.service";
import { CampaignResult } from "./preview/PreviewResult";
import { MeetingPoints } from "./preview/PreviewMeetingPoints";
import { CampaignShifts } from "./preview/PreviewShifts";
import { meetingPointName } from "@/utils/campaignLabels";

/**
 * Everything about a campaign on one screen, as its organization saw it before sending it
 * for review. Read-only; the decisions stay in the table's actions.
 */
export function CampaignPreviewDialog({
  campaignId,
  onClose,
}: {
  campaignId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useAdminLayout();
  const isDark = theme === "dark";
  const { title: localizedTitle, description: localizedDescription } = useLocalizedDisplay();
  const { data, isLoading } = useGetCampaignById(campaignId);
  const campaign = data?.data?.campaign;

  const difficulty = getDifficultyLevel(campaign?.difficulty);
  const requirements = campaign?.requirements;
  const minAge = requirements?.min_age ?? impliedMinAge(campaign?.difficulty ?? 0);
  const conditions = [
    minAge != null ? t("From {{age}} years old", { age: minAge }) : null,
    requirements?.skills?.length
      ? `${t("Required skills")}: ${requirements.skills.join(", ")}`
      : null,
    requirements?.bring_own_tools ? t("Volunteers bring their own tools") : null,
  ].filter(Boolean);
  const points = campaign?.meeting_points ?? [];
  const isPublic = campaign?.status != null && CAMPAIGN_PUBLIC_STATUSES.includes(campaign.status);
  // Back under review after an edit (spec 3.5): show what changed since it was approved.
  const reReview = Boolean(campaign?.approved_at) && campaign?.status === CAMPAIGN_STATUS.PENDING_REVIEW;
  const { data: historyData } = useGetCampaignHistory(campaignId, { enabled: reReview });
  const status = campaign?.status ?? -1;
  const shifts = campaign?.shifts ?? [];
  const hasResult =
    shifts.length > 0 &&
    (RESULT_STATUSES.includes(status) ||
      (STOPPED_STATUSES.includes(status) &&
        shifts.some((sh) => new Date(sh.start_at).getTime() <= Date.now())));
  const editedFields = Object.keys(
    historyData?.data?.history?.find((h) => h.event === "edit_major")?.changes ?? {},
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "max-h-[90vh] max-w-4xl overflow-y-auto",
          isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50 text-zinc-900",
        )}
      >
        <DialogHeader>
          <DialogTitle className={cn(isDark ? "text-zinc-100" : "text-zinc-900")}>
            {t("Preview campaign")}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !campaign ? (
          isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("Campaign not found")}</p>
          )
        ) : (
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-lg font-semibold">{localizedTitle(campaign)}</span>
              <CampaignStatusTag status={campaign.status} isDark={isDark} />
            </div>

            <Tabs defaultValue="information" className="min-w-0 gap-4">
              {hasResult && (
                <TabsList
                  className={cn(
                    "h-10 border",
                    isDark ? "border-zinc-700 bg-zinc-800" : "border-border bg-card",
                  )}
                >
                  <TabsTrigger value="information">{t("Information")}</TabsTrigger>
                  <TabsTrigger value="result">{t("Result")}</TabsTrigger>
                </TabsList>
              )}

              <TabsContent value="information" className="flex min-w-0 flex-col gap-3">
                {campaign.reject_reason && (
                  <section
                    className={cn(
                      "rounded-lg border p-4 text-sm",
                      isDark
                        ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
                        : "border-amber-500/40 bg-amber-50 text-amber-800",
                    )}
                  >
                    <span className="font-semibold">{t("Admin reason")}:</span>{" "}
                    {campaign.reject_reason}
                  </section>
                )}

                {reReview && (
                  <section
                    className={cn(
                      "rounded-lg border p-4 text-sm",
                      isDark
                        ? "border-sky-400/40 bg-sky-500/10 text-sky-100"
                        : "border-sky-500/40 bg-sky-50 text-sky-900",
                    )}
                  >
                    <p className="font-semibold">{t("Changed after approval")}</p>
                    <p className="mt-1">
                      {t("Volunteers who registered keep their place while you review it again.")}
                    </p>
                    {editedFields.length > 0 && (
                      <p className="mt-1">
                        {editedFields.map((key) => t(CHANGE_LABELS[key] ?? key)).join(" · ")}
                      </p>
                    )}
                  </section>
                )}

                <ReviewSectionCard title={t("General information")} defaultOpen isDark={isDark}>
                  <ReviewRow
                    label={t("Organization")}
                    value={
                      campaign.organization ? (
                        <OrganizationIdentity
                          org={campaign.organization}
                          isDark={isDark}
                          variant="card"
                        />
                      ) : null
                    }
                  />
                  <ReviewRow
                    label={t("Creator")}
                    value={campaign.owner ? campaign.owner.name || campaign.owner.email : null}
                  />
                  <ReviewRow
                    label={t("Difficulty")}
                    value={
                      difficulty ? (
                        <span className={difficulty.textClass}>{t(difficulty.label)}</span>
                      ) : null
                    }
                  />
                  <ReviewRow label={t("Reward (GP & SP)")} value={campaign.green_points} />
                  <ReviewRow label={t("Created at")} value={formattedDate(campaign.created_at, true)} />
                  <ReviewRow
                    label={t("Submitted")}
                    value={campaign.submitted_at ? formattedDate(campaign.submitted_at, true) : null}
                  />
                  {campaign.revision_deadline && (
                    <ReviewRow
                      label={t("Revision deadline")}
                      value={formattedDate(campaign.revision_deadline, true)}
                    />
                  )}
                  <ReviewRow
                    label={t("Description")}
                    value={
                      <RichTextContent
                        value={localizedDescription(campaign)}
                        className="text-sm leading-relaxed"
                        maxLines={4}
                        showMoreLabel={t("Show more")}
                        showLessLabel={t("Show less")}
                        emptyFallback="—"
                      />
                    }
                  />
                  <ReviewRow
                    label={t("Banner")}
                    value={
                      campaign.banner ? (
                        <Image
                          src={campaign.banner}
                          alt={localizedTitle(campaign)}
                          width={160}
                          height={90}
                          className="h-[90px] w-[160px] rounded-md object-cover"
                        />
                      ) : null
                    }
                  />
                </ReviewSectionCard>

                <ReviewSectionCard
                  title={t("Time and contact")}
                  hint={campaign.contact_name ?? undefined}
                  isDark={isDark}
                >
                  <ReviewRow
                    label={t("Campaign schedule")}
                    value={<CampaignDateRange campaign={campaign} />}
                  />
                  <ReviewRow label={t("Contact person")} value={campaign.contact_name} />
                  <ReviewRow label={t("Contact phone")} value={campaign.contact_phone} />
                  <ReviewRow label={t("Safety notes")} value={campaign.safety_notes} />
                  <ReviewRow
                    label={t("Participation conditions")}
                    value={conditions.join(" · ")}
                  />
                </ReviewSectionCard>

                <ReviewSectionCard
                  title={t("Schedule and shifts")}
                  hint={t("{{days}} days · {{points}} meeting points", {
                    days: campaign.days?.length ?? 0,
                    points: points.length,
                  })}
                  isDark={isDark}
                >
                  <CampaignShifts campaign={campaign} />
                </ReviewSectionCard>

                <ReviewSectionCard
                  title={t("Meeting points")}
                  hint={points
                    .map((p, i) => meetingPointName(p, i, t))
                    .join(" · ")}
                  isDark={isDark}
                >
                  <MeetingPoints campaign={campaign} isDark={isDark} />
                </ReviewSectionCard>
              </TabsContent>

              {hasResult && (
                <TabsContent value="result" className="min-w-0">
                  <CampaignResult campaign={campaign} isDark={isDark} />
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}

        <DialogFooter className="gap-2">
          {campaign && isPublic && (
            <Button variant="outline" asChild>
              <a href={`/campaigns/${campaign.id}`} target="_blank" rel="noopener noreferrer">
                <TbExternalLink />
                {t("Open campaign page")}
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            {t("Close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CampaignPreviewDialog;
