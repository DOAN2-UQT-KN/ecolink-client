import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Inbox } from 'lucide-react';

import { useGetCampaignRegistrations } from '@/apis/campaign/registration';
import type { IShiftRegistrations } from '@/apis/campaign/models/registration';
import Image from '@/components/ui/AppImage';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/libs/utils';

import { useCampaignDetail } from '../_hooks/useCampaignDetail';

import defaultAvatar from '@/public/default-avatar.png';

/** From this many in 90 days a count is shown in red (server `CAMPAIGN_ABSENCE_WARN_COUNT`). */
const RECORD_WARN_COUNT = 3;

const hhmm = (iso: string) => format(new Date(iso), 'HH:mm');

function RecordBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
        count >= RECORD_WARN_COUNT ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-700',
      )}
    >
      {label} {count}
    </span>
  );
}

/**
 * Managers: who registered for each shift, by day (spec 3.1). Registration needs no approval;
 * each person's recent absences and late leaves are shown so the managers can follow up.
 */
export const CampaignRegistrations = memo(function CampaignRegistrations({
  enabled,
}: {
  enabled: boolean;
}) {
  const { t } = useTranslation();
  const { campaignId, campaign } = useCampaignDetail();
  const { data, isLoading, isError } = useGetCampaignRegistrations(campaignId, {
    enabled: enabled && Boolean(campaignId),
  });

  const pointName = (shift: IShiftRegistrations) => {
    const index = (campaign?.meeting_points ?? []).findIndex((p) => p.id === shift.meeting_point_id);
    return shift.meeting_point_name || t('Meeting point {{n}}', { n: index + 1 });
  };

  const days = useMemo(() => {
    const shifts = data?.data?.shifts ?? [];
    return (campaign?.days ?? [])
      .map((day, index) => ({
        day,
        index,
        shifts: shifts.filter((s) => s.day_id === day.id),
      }))
      .filter((d) => d.shifts.length > 0);
  }, [campaign?.days, data]);

  const total = (data?.data?.shifts ?? []).reduce((sum, s) => sum + s.registered_count, 0);

  return (
    <div className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white/60 p-4 sm:p-5 shadow-sm">
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">{t('Could not load registrations.')}</p>
      ) : total === 0 ? (
        <div className="flex justify-center pt-12 pb-20">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox className="h-12 w-12 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>{t('No registrations yet.')}</EmptyTitle>
              <EmptyDescription>
                {t('Volunteers who register for a shift appear here right away.')}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {days.map(({ day, index, shifts }) => (
            <section key={day.id} className="flex flex-col gap-3">
              <h3 className="font-display-3 font-semibold text-button-accent">
                {t('Day {{n}}', { n: index + 1 })} · {format(new Date(day.start_at), 'EEEE, PP')}
              </h3>
              {shifts.map((shift) => {
                const short = Math.max(0, shift.min_volunteers - shift.registered_count);
                const over =
                  shift.max_volunteers != null && shift.registered_count > shift.max_volunteers;
                return (
                  <div
                    key={shift.shift_id}
                    className="rounded-lg border border-[rgba(136,122,71,0.3)] bg-white p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{pointName(shift)}</span>
                      <span className="text-xs text-foreground-tertiary tabular-nums">
                        {hhmm(shift.start_at)} – {hhmm(shift.end_at)}
                      </span>
                      <span className="ml-auto text-sm tabular-nums">
                        {shift.registered_count} / {shift.min_volunteers}
                        {shift.max_volunteers != null ? ` – ${shift.max_volunteers}` : '+'}
                      </span>
                      {short > 0 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          {t('{{n}} more needed', { n: short })}
                        </span>
                      )}
                      {over && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          {t('Over the expected number')}
                        </span>
                      )}
                    </div>
                    {shift.volunteers.length > 0 && (
                      <ul className="mt-3 divide-y divide-border/60">
                        {shift.volunteers.map((v) => (
                          <li key={v.user_id} className="flex items-center gap-3 py-2">
                            <Image
                              src={v.volunteer?.avatar || defaultAvatar}
                              alt={v.volunteer?.name || t('Unnamed volunteer')}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate text-sm font-medium">
                                {v.volunteer?.name || t('Unnamed volunteer')}
                              </span>
                              <span className="text-xs text-foreground-tertiary">
                                {format(new Date(v.registered_at), 'PPp')}
                              </span>
                            </div>
                            <div className="ml-auto flex flex-wrap gap-1">
                              <RecordBadge count={v.absence_count} label={t('Absent')} />
                              <RecordBadge count={v.late_leave_count} label={t('Late leave')} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </section>
          ))}
          <p className="text-xs text-foreground-tertiary">
            {t('Absences and late leaves count the last 90 days.')}
          </p>
        </div>
      )}
    </div>
  );
});

export default CampaignRegistrations;
