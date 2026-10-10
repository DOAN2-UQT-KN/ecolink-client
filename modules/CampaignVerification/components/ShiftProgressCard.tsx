import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import type { ICampaign } from '@/apis/campaign/models/campaign';
import { useShiftOverview } from '@/apis/campaign/getShiftOverview';
import type { IShiftOverviewRow } from '@/apis/campaign/models/shiftResult';
import { ReviewSectionCard } from '@/components/ui/ReviewSection';
import { CollapsibleCard } from '@/components/client/shared/CollapsibleCard';
import { PILL_TONE } from '@/components/ui/Pill';
import { cn } from '@/libs/utils';
import { SHIFT_STATUS_LABEL, SHIFT_STATUS_TONE } from '@/constants/campaignVerification';
import { ShiftCellPopover } from './ShiftCellPopover';

const LEGEND = ['upcoming', 'running', 'awaiting_result', 'ended', 'off'] as const;

function Stat({ label, value, className, labelClassName }: { label: string; value: string; className?: string; labelClassName?: string }) {
  return (
    <div className={cn('flex flex-col rounded-lg border px-3 py-2', className ?? 'border-[rgba(136,122,71,0.3)] bg-white/70')}>
      <span className={cn('text-xs', labelClassName ?? 'text-foreground-tertiary')}>{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

/**
 * Progress of every shift (spec 4.2), for anyone signed in (public campaign; managers and admins always): a day × meeting
 * point grid coloured by status (each cell opens a popover with the shift's result), and the totals
 * so far. Shown in the campaign's Progress tab.
 */
export const ShiftProgressCard = /* @__PURE__ */ memo(function ShiftProgressCard({
  campaign,
  variant = 'page',
  isDark = false,
  hideStats = false,
  defaultOpen = true,
}: {
  campaign: ICampaign;
  /** Leave out the totals (shown elsewhere, e.g. the admin's completion summary). */
  hideStats?: boolean;
  defaultOpen?: boolean;
  /** `admin`: the admin review card (zinc, `isDark`) instead of the campaign page's card. */
  variant?: 'page' | 'admin';
  isDark?: boolean;
}) {
  const { t } = useTranslation('common');
  const admin = variant === 'admin';
  const dark = admin && isDark;
  const ui = admin
    ? {
        stat: dark ? 'border-zinc-700 bg-zinc-800/60' : 'border-zinc-200 bg-zinc-50',
        muted: 'text-muted-foreground',
        rule: dark ? 'border-zinc-700' : 'border-zinc-200',
        ring: 'data-[state=open]:ring-zinc-400/50',
      }
    : {
        stat: undefined,
        muted: 'text-foreground-tertiary',
        rule: 'border-[rgba(136,122,71,0.2)]',
        ring: 'data-[state=open]:ring-button-accent/40',
      };
  const toneOf = (status: keyof typeof SHIFT_STATUS_TONE) => PILL_TONE[SHIFT_STATUS_TONE[status]][dark ? 'dark' : 'light'];
  const { data } = useShiftOverview(campaign.id, { enabled: Boolean(campaign.id) });
  const overview = data?.data;
  if (!overview) return null;
  if (overview.shifts.length === 0) {
    return <p className={cn('text-sm', admin ? 'text-muted-foreground' : 'text-foreground-tertiary')}>{t('No shifts yet')}</p>;
  }

  const days = campaign.days ?? [];
  const points = campaign.meeting_points ?? [];
  const cell = new Map<string, IShiftOverviewRow>(
    overview.shifts.map((s) => [`${s.day_id}:${s.meeting_point_id}`, s]),
  );
  const pointName = (index: number) =>
    points[index]?.name?.trim() || t('Meeting point {{n}}', { n: index + 1 });
  const totals = overview.totals;

  const content = (
      <div className="flex flex-col gap-4">
        {!hideStats && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Stat
              className={ui.stat}
              labelClassName={ui.muted}
              label={t('Shifts ended')}
              value={`${totals.ended_shifts} / ${totals.active_shifts}`}
            />
            <Stat className={ui.stat} labelClassName={ui.muted} label={t('Present / registered')} value={`${totals.present} / ${totals.registered}`} />
            <Stat
              className={ui.stat}
              labelClassName={ui.muted}
              label={t('Attendance rate')}
              value={totals.present_rate == null ? '—' : `${Math.round(totals.present_rate * 100)}%`}
            />
            <Stat className={ui.stat} labelClassName={ui.muted} label={t('Bags')} value={String(totals.waste_bags)} />
            <Stat className={ui.stat} labelClassName={ui.muted} label={t('Weight (kg)')} value={String(totals.waste_kg)} />
            <Stat
              className={ui.stat}
              labelClassName={ui.muted}
              label={t('Waste points cleaned / partly / not handled')}
              value={`${totals.reports.cleaned} / ${totals.reports.partial} / ${totals.reports.untouched}`}
            />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={cn('text-left text-xs', ui.muted)}>
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
                <tr key={day.id ?? di} className={cn('border-t', ui.rule)}>
                  <td className="whitespace-nowrap py-2 pr-3">
                    {t('Day {{n}}', { n: di + 1 })}
                    <span className={cn('block text-xs', ui.muted)}>
                      {format(new Date(day.start_at), 'dd/MM')}
                    </span>
                  </td>
                  {points.map((p, pi) => {
                    const s = cell.get(`${day.id}:${p.id}`);
                    if (!s) return <td key={p.id ?? pi} className={cn('py-2 pr-3', ui.muted)}>—</td>;
                    const tone = toneOf(s.status);
                    const body = (
                      <>
                        <span className="block font-medium">{t(SHIFT_STATUS_LABEL[s.status])}</span>
                        {s.reopened_at && (
                          <span className={cn('block text-xs font-semibold', dark ? 'text-red-300' : 'text-red-700')}>{t('Needs more')}</span>
                        )}
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
                          <ShiftCellPopover
                            campaign={campaign}
                            row={s}
                            title={`${pointName(pi)} · ${t('Day {{n}}', { n: di + 1 })} ${format(new Date(day.start_at), 'dd/MM')}`}
                          >
                            <button
                              type="button"
                              className={cn(
                                'block w-full rounded-lg border px-3 py-2 text-left hover:opacity-80 data-[state=open]:ring-2',
                                ui.ring,
                                tone,
                              )}
                            >
                              {body}
                            </button>
                          </ShiftCellPopover>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={cn('flex flex-wrap gap-3 text-xs', ui.muted)}>
          {LEGEND.map((status) => (
            <span key={status} className="flex items-center gap-1.5">
              <span className={cn('inline-block size-3 rounded-sm border', toneOf(status))} />
              {t(SHIFT_STATUS_LABEL[status])}
            </span>
          ))}
        </div>
      </div>
  );

  return admin ? (
    <ReviewSectionCard title={t('Shift progress')} defaultOpen={defaultOpen} isDark={isDark}>
      {content}
    </ReviewSectionCard>
  ) : (
    <CollapsibleCard title={t('Shift progress')} defaultOpen={defaultOpen}>
      {content}
    </CollapsibleCard>
  );
});
