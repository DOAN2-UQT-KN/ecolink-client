import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import type { ICampaign } from '@/apis/campaign/models/campaign';
import { useShiftOverview, type IShiftOverviewRow } from '@/apis/campaign/shiftResult';
import { CollapsibleCard } from '@/components/client/shared/CollapsibleCard';
import { PILL_TONE } from '@/components/ui/Pill';
import { Link } from '@/libs/router';
import { cn } from '@/libs/utils';
import { SHIFT_STATUS_LABEL, SHIFT_STATUS_TONE } from './ShiftStatusPill';

const LEGEND = ['upcoming', 'running', 'awaiting_result', 'ended', 'off'] as const;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-lg border border-[rgba(136,122,71,0.3)] bg-white/70 px-3 py-2">
      <span className="text-xs text-foreground-tertiary">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

/**
 * Progress of every shift (spec 4.2), for the campaign's managers and admins: a day × meeting
 * point grid coloured by status (each cell opens the shift), and the totals so far.
 */
export const ShiftProgressCard = memo(function ShiftProgressCard({ campaign }: { campaign: ICampaign }) {
  const { t } = useTranslation('common');
  const { data } = useShiftOverview(campaign.id, { enabled: Boolean(campaign.id) });
  const overview = data?.data;
  if (!overview || overview.shifts.length === 0) return null;

  const days = campaign.days ?? [];
  const points = campaign.meeting_points ?? [];
  const cell = new Map<string, IShiftOverviewRow>(
    overview.shifts.map((s) => [`${s.day_id}:${s.meeting_point_id}`, s]),
  );
  const pointName = (index: number) =>
    points[index]?.name?.trim() || t('Meeting point {{n}}', { n: index + 1 });
  const totals = overview.totals;

  return (
    <CollapsibleCard title={t('Shift progress')}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Stat
            label={t('Shifts ended')}
            value={`${totals.ended_shifts} / ${totals.active_shifts}`}
          />
          <Stat label={t('Present / registered')} value={`${totals.present} / ${totals.registered}`} />
          <Stat
            label={t('Attendance rate')}
            value={totals.present_rate == null ? '—' : `${Math.round(totals.present_rate * 100)}%`}
          />
          <Stat label={t('Bags')} value={String(totals.waste_bags)} />
          <Stat label={t('Weight (kg)')} value={String(totals.waste_kg)} />
          <Stat
            label={t('Waste points cleaned / partly / not handled')}
            value={`${totals.reports.cleaned} / ${totals.reports.partial} / ${totals.reports.untouched}`}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-foreground-tertiary">
              <tr>
                <th className="py-2 pr-3 font-medium">{t('Day')}</th>
                {points.map((p, i) => (
                  <th key={p.id ?? i} className="py-2 pr-3 font-medium">
                    {pointName(i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, di) => (
                <tr key={day.id ?? di} className="border-t border-[rgba(136,122,71,0.2)]">
                  <td className="whitespace-nowrap py-2 pr-3">
                    {t('Day {{n}}', { n: di + 1 })}
                    <span className="block text-xs text-foreground-tertiary">
                      {format(new Date(day.start_at), 'dd/MM')}
                    </span>
                  </td>
                  {points.map((p, pi) => {
                    const s = cell.get(`${day.id}:${p.id}`);
                    if (!s) return <td key={p.id ?? pi} className="py-2 pr-3 text-foreground-tertiary">—</td>;
                    const tone = PILL_TONE[SHIFT_STATUS_TONE[s.status]].light;
                    const body = (
                      <>
                        <span className="block font-medium">{t(SHIFT_STATUS_LABEL[s.status])}</span>
                        {s.status !== 'off' && (
                          <span className="block text-xs tabular-nums opacity-80">
                            {t('{{present}}/{{registered}} present', {
                              present: s.present,
                              registered: s.registered,
                            })}
                          </span>
                        )}
                      </>
                    );
                    return (
                      <td key={p.id ?? pi} className="py-2 pr-3">
                        {s.status === 'off' ? (
                          <div className={cn('rounded-lg border px-3 py-2', tone)}>{body}</div>
                        ) : (
                          <Link
                            href={`/campaigns/${campaign.id}/shifts/${s.shift_id}`}
                            className={cn('block rounded-lg border px-3 py-2 hover:opacity-80', tone)}
                          >
                            {body}
                          </Link>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-foreground-tertiary">
          {LEGEND.map((status) => (
            <span key={status} className="flex items-center gap-1.5">
              <span className={cn('inline-block size-3 rounded-sm border', PILL_TONE[SHIFT_STATUS_TONE[status]].light)} />
              {t(SHIFT_STATUS_LABEL[status])}
            </span>
          ))}
        </div>
      </div>
    </CollapsibleCard>
  );
});
