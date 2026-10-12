import { memo, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { TbChevronDown, TbExternalLink } from 'react-icons/tb';

import type { ICampaign } from '@/apis/campaign/models/campaign';
import { useShiftResult } from '@/apis/campaign/getShiftResult';
import type { IShiftOverviewRow } from '@/apis/campaign/models/shiftResult';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';
import { Link } from '@/libs/router';
import {
  ShiftReopenedNotice,
  ShiftReopenedPill,
  ShiftStatusPill,
} from './ShiftStatusPill';
import { ShiftResultAmounts, ShiftResultIncludedMedia, ShiftResultWastePoints } from './ShiftResultView';

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
export const ShiftCellPopover = /* @__PURE__ */ memo(function ShiftCellPopover({
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
            <Link
              href={`/campaigns/${campaign.id}/shifts/${row.shift_id}`}
              className="inline-flex items-center gap-1 text-sm text-button-accent underline underline-offset-2 hover:opacity-80"
            >
              {t('Open shift page')}
              <TbExternalLink className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <ShiftStatusPill status={row.status} />
            {row.reopened_at && <ShiftReopenedPill />}
          </div>
          {row.reopened_at && <ShiftReopenedNotice reason={row.reopen_reason} />}
          <span className="text-xs tabular-nums text-foreground-tertiary">{hours}</span>
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
