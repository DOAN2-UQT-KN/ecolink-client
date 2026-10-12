import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TbChevronRight, TbClock, TbPhone, TbSos, TbUser, TbUsers } from 'react-icons/tb';

import { useSosList } from '@/apis/sos/getSos';
import type { ISosSummary } from '@/apis/sos/models/sos';
import { SosButton } from '@/components/sos/SosButton';
import { SosStatePill } from '@/components/sos/SosTypeBadge';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Pill } from '@/components/ui/Pill';
import { Skeleton } from '@/components/ui/skeleton';
import { SOS_ROLE_LABEL, SOS_TYPE_META, isSosOpen } from '@/constants/sos';
import { Link } from '@/libs/router';
import { cn } from '@/libs/utils';
import { formattedDate } from '@/utils/formattedDate';

import { useCampaignDetail } from '../_hooks/useCampaignDetail';

type SosChip = 'open' | 'closed' | 'all';

const CHIPS: { value: SosChip; labelKey: string }[] = [
  { value: 'open', labelKey: 'Open' },
  { value: 'closed', labelKey: 'Closed' },
  { value: 'all', labelKey: 'All' },
];

/** One campaign's SOS history; the server decides what each viewer sees (names, phone). */
const SOS_LIST_LIMIT = 100;

const matchesChip = (sos: ISosSummary, chip: SosChip) =>
  chip === 'all' || (chip === 'open' ? isSosOpen(sos.state) : !isSosOpen(sos.state));

const SosRow = memo(function SosRow({ sos }: { sos: ISosSummary }) {
  const { t } = useTranslation();
  const meta = SOS_TYPE_META[sos.type];
  const Icon = meta.icon;
  const coming = sos.on_the_way_count + sos.arrived_count;

  return (
    <li>
      <Link
        href={`/sos/${sos.id}`}
        className="group flex items-center gap-3 rounded-lg border border-[rgba(136,122,71,0.25)] bg-background px-3 py-3 transition-colors hover:border-[rgba(136,122,71,0.5)] hover:bg-background-primary/20 sm:px-4"
      >
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full border',
            meta.bgClass,
            meta.borderClass,
            meta.textClass,
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('font-semibold', meta.textClass)}>{t(meta.label)}</span>
            <SosStatePill state={sos.state} />
            {sos.is_mine ? <Pill tone="brand">{t('Your SOS')}</Pill> : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-tertiary">
            <span className="inline-flex items-center gap-1">
              <TbClock className="size-3.5 shrink-0" aria-hidden />
              {formattedDate(sos.created_at, true)}
            </span>
            {sos.type !== 'hazard' ? (
              <span className="inline-flex items-center gap-1">
                <TbUsers className="size-3.5 shrink-0" aria-hidden />
                {sos.type === 'manpower' && sos.people_needed
                  ? t('{{count}} / {{needed}} people on the way', {
                      count: coming,
                      needed: sos.people_needed,
                    })
                  : t('{{onWay}} on the way · {{arrived}} arrived', {
                      onWay: sos.on_the_way_count,
                      arrived: sos.arrived_count,
                    })}
              </span>
            ) : null}
            {sos.reporter?.name ? (
              <span className="inline-flex items-center gap-1">
                <TbUser className="size-3.5 shrink-0" aria-hidden />
                {sos.reporter.name}
                {sos.reporter_role ? ` · ${t(SOS_ROLE_LABEL[sos.reporter_role])}` : null}
              </span>
            ) : null}
            {sos.phone ? (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <TbPhone className="size-3.5 shrink-0" aria-hidden />
                {sos.phone}
              </span>
            ) : null}
          </div>
        </div>

        <TbChevronRight
          className="size-5 shrink-0 text-foreground-tertiary transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </li>
  );
});

/** "SOS" tab of the campaign detail (signed-in viewers): the campaign's SOS, live first. */
export const CampaignSosTab = memo(function CampaignSosTab({ enabled }: { enabled: boolean }) {
  const { t } = useTranslation();
  const { campaignId } = useCampaignDetail();
  const [chip, setChip] = useState<SosChip>('open');

  const { data, isLoading, isError } = useSosList({ campaign_id: campaignId, states: 'all', limit: SOS_LIST_LIMIT }, {
    enabled: enabled && Boolean(campaignId),
  });
  const items = data?.data?.items ?? [];

  const counts = {
    open: items.filter((s) => matchesChip(s, 'open')).length,
    closed: items.filter((s) => matchesChip(s, 'closed')).length,
    all: items.length,
  };
  const visible = items.filter((s) => matchesChip(s, chip));

  return (
    <div className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white/60 p-4 sm:p-5 shadow-sm">
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">{t('Could not load SOS.')}</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('SOS')}>
            {CHIPS.map((item) => {
              const active = chip === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setChip(item.value)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 !text-xs font-medium transition-colors',
                    active
                      ? 'border-button-accent bg-button-accent text-white'
                      : 'border-[rgba(136,122,71,0.35)] bg-background text-foreground-secondary hover:text-foreground',
                  )}
                >
                  {t(item.labelKey)}
                  <span className={cn('tabular-nums !text-[11px]', active ? 'text-white/80' : 'text-foreground-tertiary')}>
                    {counts[item.value]}
                  </span>
                </button>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <div className="flex justify-center pt-8 pb-12">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <TbSos className="h-12 w-12 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle>
                    {chip === 'open' ? t('No open SOS') : t('No SOS yet.')}
                  </EmptyTitle>
                  <EmptyDescription>
                    {t('SOS sent during this campaign\'s shifts appear here.')}
                  </EmptyDescription>
                </EmptyHeader>
                {campaignId ? (
                  <EmptyContent>
                    <SosButton campaignId={campaignId} />
                  </EmptyContent>
                ) : null}
              </Empty>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {visible.map((sos) => (
                <SosRow key={sos.id} sos={sos} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
});
