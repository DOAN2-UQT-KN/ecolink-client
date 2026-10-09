import { memo } from "react";
import { useTranslation } from "react-i18next";
import type { ICampaign } from "@/apis/campaign/models/campaign";
import { useGetMembersByOrg } from "@/apis/organization/organizationById";
import { formattedDate } from "@/utils/formattedDate";
import { ShiftSlotsTable } from "@/components/client/shared/ShiftSlotsTable";
import { hhmm, meetingPointName } from "@/utils/campaignLabels";

/** The days, the volunteers needed on every day × meeting point, and who leads each shift. */
export const CampaignShifts = memo(function CampaignShifts({ campaign }: { campaign: ICampaign }) {
  const { t } = useTranslation();
  const days = [...(campaign.days ?? [])].sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
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
  const pointName = (index: number) => meetingPointName(points[index], index, t);

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
