import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TbExternalLink, TbMapPin } from "react-icons/tb";

import { useGetCampaignById } from "@/apis/campaign/campaignById";
import type { ICampaign } from "@/apis/campaign/models/campaign";
import { useGetMembersByOrg } from "@/apis/organization/organizationById";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";
import { impliedMinAge } from "@/app/(pages)/(main)/campaigns/create/_services/campaign.service";
import { OrganizationIdentity } from "@/components/admin/shared/OrganizationIdentity";
import { ReviewRow, ReviewSectionCard } from "@/components/admin/shared/ReviewSection";
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
import { CAMPAIGN_PUBLIC_STATUSES } from "@/constants/campaignLifecycle";
import { getDifficultyLevel } from "@/constants/difficulty";
import { useLocalizedDisplay } from "@/hooks/useLocalizedDisplay";
import { cn } from "@/libs/utils";
import { formattedDate } from "@/utils/formattedDate";
import { format } from "date-fns";
import { CampaignDateRange } from "@/components/client/shared/CampaignDateRange";
import { ShiftSlotsTable } from "@/components/client/shared/ShiftSlotsTable";

const MeetingPoints = memo(function MeetingPoints({
  campaign,
  isDark,
}: {
  campaign: ICampaign;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const { title: localizedTitle } = useLocalizedDisplay();
  const points = campaign.meeting_points ?? [];
  const reportsById = useMemo(
    () => new Map((campaign.reports ?? []).map((r) => [r.id, r])),
    [campaign.reports],
  );

  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">—</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {points.map((point, index) => (
        <div
          key={point.id ?? index}
          className={cn(
            "flex flex-col gap-2",
            index > 0 && "border-t pt-4",
            isDark ? "border-zinc-700" : "border-zinc-200",
          )}
        >
          <span className="font-semibold">
            {point.name || t("Meeting point {{n}}", { n: index + 1 })}
          </span>
          <ReviewRow
            label={t("Location")}
            value={
              <a
                href={`https://www.google.com/maps?q=${point.latitude},${point.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1 underline",
                  isDark ? "text-blue-300" : "text-blue-600",
                )}
              >
                <TbMapPin className="shrink-0" />
                {point.detail_address || `${point.latitude}, ${point.longitude}`}
              </a>
            }
          />
          <ReviewRow
            label={t("Waste points")}
            value={
              point.report_ids.length === 0 ? (
                t("No waste points")
              ) : (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">
                    {point.report_ids.length} · {t("within {{km}} km", { km: point.radius_km })}
                  </span>
                  <ul className="list-disc pl-4">
                    {point.report_ids.map((id) => {
                      const report = reportsById.get(id);
                      return (
                        <li key={id}>
                          <a
                            href={`/incidents/${id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline-offset-2 hover:underline"
                          >
                            {(report && localizedTitle(report)) || id}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )
            }
          />
        </div>
      ))}
    </div>
  );
});

/** The days, the volunteers needed on every day × meeting point, and who leads each shift. */
const CampaignShifts = memo(function CampaignShifts({ campaign }: { campaign: ICampaign }) {
  const { t } = useTranslation();
  const days = useMemo(
    () =>
      [...(campaign.days ?? [])].sort(
        (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
      ),
    [campaign.days],
  );
  const points = campaign.meeting_points ?? [];
  const shifts = campaign.shifts ?? [];
  const { data: membersData } = useGetMembersByOrg(
    { organization_id: campaign.organization_id ?? "", page: 1, limit: 100 },
    { enabled: Boolean(campaign.organization_id) && shifts.length > 0 },
  );
  const memberName = (userId?: string | null) => {
    if (!userId) return "—";
    const member = membersData?.data?.members?.find((m) => m.user_id === userId);
    return member?.user?.name || member?.user?.email || "—";
  };
  const shiftOf = (dayId: string, pointId?: string) =>
    shifts.find((sh) => sh.day_id === dayId && sh.meeting_point_id === pointId);
  const hhmm = (iso: string) => format(new Date(iso), "HH:mm");
  const pointName = (index: number) =>
    points[index]?.name || t("Meeting point {{n}}", { n: index + 1 });

  if (days.length === 0) {
    return <p className="text-sm text-muted-foreground">—</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <ShiftSlotsTable
        days={days.map((day, d) => ({
          label: `${t("Day {{n}}", { n: d + 1 })} · ${formattedDate(day.start_at)}`,
          hours: `${hhmm(day.start_at)} – ${hhmm(day.end_at)}`,
        }))}
        points={points.map((_, p) => pointName(p))}
        cells={days.map((day) =>
          points.map((point) => {
            const shift = shiftOf(day.id, point.id);
            return {
              hours: shift ? `${hhmm(shift.start_at)} – ${hhmm(shift.end_at)}` : null,
              minVolunteers: shift?.min_volunteers ?? 0,
              maxVolunteers: shift?.max_volunteers ?? null,
              gatherTime: shift?.gather_at ? hhmm(shift.gather_at) : null,
              leader: shift?.leader_user_id ? memberName(shift.leader_user_id) : null,
            };
          }),
        )}
        suggestedMinPerDay={campaign.suggested_min_volunteers ?? null}
        variant="admin"
      />
      {campaign.min_volunteers_reason && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <span className="font-semibold">{t("Why fewer volunteers than suggested")}:</span>{" "}
          {campaign.min_volunteers_reason}
        </p>
      )}
    </div>
  );
});

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
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-lg font-semibold">{localizedTitle(campaign)}</span>
              <CampaignStatusTag status={campaign.status} isDark={isDark} />
            </div>

            <div className="flex flex-col gap-3">
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
                  <ReviewRow
                    label={t("Max volunteers")}
                    value={campaign.max_members ?? t("No limit")}
                  />
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

                <ReviewSectionCard title={t("Time and contact")} defaultOpen isDark={isDark}>
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
                  defaultOpen
                  isDark={isDark}
                >
                  <CampaignShifts campaign={campaign} />
                </ReviewSectionCard>

                <ReviewSectionCard
                  title={t("Meeting points")}
                  hint={`${points.length}`}
                  defaultOpen
                  isDark={isDark}
                >
                  <MeetingPoints campaign={campaign} isDark={isDark} />
                </ReviewSectionCard>
            </div>
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
