import { memo, useEffect } from 'react';
import { useWatch, type FieldError as RHFFieldError } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { IMember } from '@/apis/organization/models/organizationMembers';
import useAuthStore from '@/stores/useAuthStore';

import { useCampaign } from '../_context/CampaignContext';
import { useDayLabel } from '../_hooks/useDayLabel';
import { useLeaderOptions } from '../../_hooks/useLeaderOptions';
import { fitSchedule, type CampaignFormValues } from '../_services/campaign.service';
import { daysBelowSuggestion } from '../_services/shiftSchedule.service';
import { meetingPointName } from '@/utils/campaignLabels';
import MinVolunteersReasonField from './MinVolunteersReasonField';
import ShiftsSingleForm from './ShiftsSingleForm';
import ShiftsTable from './ShiftsTable';

/** What the single-shift form and the grid both render from. */
export interface ShiftsViewProps {
  days: CampaignFormValues['days'];
  points: CampaignFormValues['meeting_points'];
  schedule: CampaignFormValues['schedule'];
  members: IMember[];
  /** Days whose total minimum is under what the difficulty suggests. */
  belowSuggestion: number[];
  /** Messages per day: its cells, and the server's day-level ones. */
  dayMessages: string[][];
  cellErrors: (d: number, p: number) => Record<string, RHFFieldError> | undefined;
  dayLabel: (day: CampaignFormValues['days'][number], index: number) => string;
  pointName: (index: number) => string;
}

/**
 * Step 4 (spec 1.4): volunteers per shift, one shift per day × meeting point. Each shift has its
 * hours (the day's by default), a minimum (0 turns it off) and an optional expected maximum;
 * neither caps sign-ups. Each day
 * needs one shift on; a day below the difficulty's suggested minimum needs a reason. A one-day,
 * one-point campaign shows a single set of fields.
 */
const StepShifts = memo(function StepShifts() {
  const { t } = useTranslation();
  const { form, suggestedMinPerDay, campaign } = useCampaign();
  const { control, setValue, formState } = form;
  const days = useWatch({ control, name: 'days' });
  const points = useWatch({ control, name: 'meeting_points' });
  const schedule = useWatch({ control, name: 'schedule' });
  const organizationId = useWatch({ control, name: 'organization_id' });
  const dayLabel = useDayLabel();
  const single = days.length === 1 && points.length === 1;
  const currentUserId = useAuthStore((s) => s.user?.id) ?? '';

  // The grid always matches the days and meeting points, even for drafts saved before a change.
  useEffect(() => {
    const shaped =
      schedule.length === days.length && schedule.every((row) => row.length === points.length);
    if (!shaped) {
      setValue('schedule', fitSchedule(schedule, days.length, points.length, currentUserId));
    }
  }, [currentUserId, days.length, points.length, schedule, setValue]);

  // Only the campaign's team may lead a shift (spec 3.4).
  const members = useLeaderOptions({
    organizationId,
    campaignId: campaign?.id,
    createdBy: campaign?.created_by ?? currentUserId,
  });

  const belowSuggestion = daysBelowSuggestion(days.length, schedule, suggestedMinPerDay);

  const scheduleErrors = formState.errors.schedule;
  const dayMessages = days.map((_, d) => {
    const row = scheduleErrors?.[d] as
      | (Record<number, { min_volunteers?: RHFFieldError }> & { message?: string })
      | undefined;
    const messages = new Set<string>();
    if (row?.message) messages.add(row.message);
    points.forEach((__, p) => {
      const message = row?.[p]?.min_volunteers?.message;
      if (message) messages.add(message);
    });
    return [...messages];
  });

  const view: ShiftsViewProps = {
    days,
    points,
    schedule,
    members,
    belowSuggestion,
    dayMessages,
    cellErrors: (d, p) =>
      (scheduleErrors?.[d] as Record<number, Record<string, RHFFieldError>> | undefined)?.[p],
    dayLabel,
    pointName: (index) => meetingPointName(points[index], index, t),
  };

  return (
    <div className="w-full flex flex-col gap-6 px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5">
      {single ? <ShiftsSingleForm {...view} /> : <ShiftsTable {...view} />}
      {belowSuggestion.length > 0 && <MinVolunteersReasonField />}
    </div>
  );
});

export default StepShifts;
