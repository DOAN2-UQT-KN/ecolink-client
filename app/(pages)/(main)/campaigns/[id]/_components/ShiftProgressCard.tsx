import { memo, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { TbChevronDown } from 'react-icons/tb';

import type { ICampaign } from '@/apis/campaign/models/campaign';
import { useShiftOverview, useShiftResult, type IShiftOverviewRow } from '@/apis/campaign/shiftResult';
import { CollapsibleCard } from '@/components/client/shared/CollapsibleCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PILL_TONE } from '@/components/ui/Pill';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';
import { Link } from '@/libs/router';
import { cn } from '@/libs/utils';
import {
  SHIFT_STATUS_LABEL,
  SHIFT_STATUS_TONE,
  ShiftReopenedNotice,
  ShiftReopenedPill,
  ShiftStatusPill,
} from './ShiftStatusPill';
import { ShiftResultAmounts, ShiftResultIncludedMedia, ShiftResultWastePoints } from './ShiftResultView';

const LEGEND = ['upcoming', 'running', 'awaiting_result', 'ended', 'off'] as const;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-lg border border-[rgba(136,122,71,0.3)] bg-white/70 px-3 py-2">
      <span className="text-xs text-foreground-tertiary">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

/** One collapsible part of the shift popover. */
function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="border-t border-[rgba(136,122,71,0.2)]">
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 py-2 text-left text-sm font-semibold">
        {title}
        <TbChevronDown className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" aria-hidden />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-3 text-sm">{children}</CollapsibleContent>
    </Collapsible>
  );
}

/**
 * The result of one shift, opened from its cell in the grid: people (from the overview), then the
 * waste points, the activity photos in the result and the description and amounts. The result is
 * fetched only while the popover is open.
 */
const ShiftCellPopover = memo(function ShiftCellPopover({
  campaign,
  row,
  title,
  children,
}: {
  campaign: ICampaign;
  row: IShiftOverviewRow;
  /** Meeting point · day, shown in the header. */
  title: string;
  /** The cell itself, used as the trigger. */
  children: ReactNode;
}) {
  const { t } = useTranslation('common');
  const { title: localizedTitle } = useLocalizedDisplay();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useShiftResult(
    { campaign_id: campaign.id, shift_id: row.shift_id },
    { enabled: open },
  );
  const view = data?.data;
  const result = view?.result ?? null;

  // Waste points of the shift's meeting point, for their titles.
  const reports = useMemo(() => {
    const point = campaign.meeting_points?.find((p) => p.id === row.meeting_point_id);
    const ids = new Set(point?.report_ids ?? []);
    return (campaign.reports ?? []).filter((r) => ids.has(r.id));
  }, [campaign.meeting_points, campaign.reports, row.meeting_point_id]);
  const reportById = useMemo(() => new Map(reports.map((r) => [r.id, r])), [reports]);
  const reportTitle = (id: string) => {
    const r = reportById.get(id);
    return (r && localizedTitle(r).trim()) || t('Waste point');
  };

  const hours = `${format(new Date(row.start_at), 'HH:mm')}–${format(new Date(row.ended_at ?? row.end_at), 'HH:mm')}`;
  const notSubmitted = <p className="text-foreground-tertiary">{t('Not submitted yet')}</p>;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={16}
        className="flex max-h-[min(70vh,var(--radix-popover-content-available-height))] w-[min(420px,calc(100vw-32px))] flex-col overflow-y-auto p-4"
      >
        <div className="mb-2 flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">{title}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <ShiftStatusPill status={row.status} />
              {row.reopened_at && <ShiftReopenedPill />}
            </div>
          </div>
          {row.reopened_at && <ShiftReopenedNotice reason={row.reopen_reason} />}
          <span className="text-xs tabular-nums text-foreground-tertiary">{hours}</span>
          <Link
            href={`/campaigns/${campaign.id}/shifts/${row.shift_id}`}
            className="w-fit text-sm text-button-accent underline-offset-2 hover:underline"
          >
            {t('Open shift page')}
          </Link>
        </div>

        <Section title={t('People')} defaultOpen>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                [t('Registered'), row.registered],
                [t('Present'), row.present],
                [t('Eligible'), row.eligible],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex flex-col rounded-lg border border-[rgba(136,122,71,0.3)] bg-white/70 px-3 py-2">
                <span className="text-xs text-foreground-tertiary">{label}</span>
                <span className="font-semibold tabular-nums">{value}</span>
              </div>
            ))}
          </div>
        </Section>

        {isLoading ? (
          <p className="py-2 text-sm text-foreground-tertiary">{t('Loading')}…</p>
        ) : !view || !result ? (
          <div className="border-t border-[rgba(136,122,71,0.2)] py-3 text-sm">{notSubmitted}</div>
        ) : (
          <>
            <Section title={t('Waste points')}>
              {view.report_ids.length === 0 ? (
                <p className="text-foreground-tertiary">{t('This meeting point has no waste points.')}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <ShiftResultWastePoints
                    reportIds={view.report_ids}
                    reports={result.reports}
                    reportTitle={reportTitle}
                    thumbClassName="size-16"
                  />
                </div>
              )}
            </Section>
            <Section title={t('Shift activity photos')}>
              <ShiftResultIncludedMedia media={view.media} thumbClassName="size-16" />
            </Section>
            <Section title={t('Description and amounts')}>
              <div className="flex flex-col gap-2">
                <ShiftResultAmounts result={result} />
              </div>
            </Section>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
});

/**
 * Progress of every shift (spec 4.2), for anyone signed in (public campaign; managers and admins always): a day × meeting
 * point grid coloured by status (each cell opens a popover with the shift's result), and the totals
 * so far. Shown in the campaign's Progress tab.
 */
export const ShiftProgressCard = memo(function ShiftProgressCard({ campaign }: { campaign: ICampaign }) {
  const { t } = useTranslation('common');
  const { data } = useShiftOverview(campaign.id, { enabled: Boolean(campaign.id) });
  const overview = data?.data;
  if (!overview) return null;
  if (overview.shifts.length === 0) {
    return <p className="text-sm text-foreground-tertiary">{t('No shifts yet')}</p>;
  }

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
                        {s.reopened_at && (
                          <span className="block text-xs font-semibold text-red-700">{t('Needs more')}</span>
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
                                'block w-full rounded-lg border px-3 py-2 text-left hover:opacity-80 data-[state=open]:ring-2 data-[state=open]:ring-button-accent/40',
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
