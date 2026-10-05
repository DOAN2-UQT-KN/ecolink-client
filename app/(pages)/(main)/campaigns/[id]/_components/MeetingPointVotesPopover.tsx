import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TbChartBar, TbChevronDown } from 'react-icons/tb';

import type { IMeetingPointVote, MeetingPointVoteValue } from '@/apis/campaign/verification';
import Image from '@/components/ui/AppImage';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Pill } from '@/components/ui/Pill';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/libs/utils';
import defaultAvatar from '@/public/default-avatar.png';
import { formattedDate } from '@/utils/formattedDate';

import { WEIGHT_REASON_LABEL } from './ResultVerificationBadges';
import { Thumb } from './ShiftResultView';

type Tab = 'all' | MeetingPointVoteValue;

/** One vote: the voter, and for "not clean" the reason, folded. Weights only reach admins and managers. */
const VoteRow = memo(function VoteRow({
  vote: v,
  titleById,
  showSide,
}: {
  vote: IMeetingPointVote;
  titleById: Map<string, string>;
  showSide: boolean;
}) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const hasReason = v.value === 'down' && (v.flagged_report_ids.length > 0 || Boolean(v.note) || Boolean(v.photo_url));

  const header = (
    <div className="flex items-center gap-2.5">
      <Image
        src={v.user?.avatar || defaultAvatar}
        alt={v.user?.name || t('User')}
        width={32}
        height={32}
        className="size-8 shrink-0 rounded-full object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="min-w-0 break-words font-medium">{v.user?.name || t('User')}</span>
          {showSide && (
            <Pill tone={v.value === 'up' ? 'green' : 'red'}>{v.value === 'up' ? t('Clean') : t('Not clean')}</Pill>
          )}
        </span>
        <span className="text-xs text-foreground-tertiary">
          {v.weight != null && `${t('weight {{w}}', { w: v.weight })} · `}
          {v.weight_reason && `${t(WEIGHT_REASON_LABEL[v.weight_reason] ?? v.weight_reason)} · `}
          {v.distance_m != null && `${t('{{m}} m away', { m: Math.round(v.distance_m) })} · `}
          {formattedDate(v.updated_at, true)}
        </span>
      </div>
      {hasReason && (
        <CollapsibleTrigger className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-button-accent">
          {t('Reason')}
          <TbChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
        </CollapsibleTrigger>
      )}
    </div>
  );

  if (!hasReason) return <li className="py-2.5">{header}</li>;

  return (
    <li className="py-2.5">
      <Collapsible open={open} onOpenChange={setOpen}>
        {header}
        <CollapsibleContent className="flex flex-col gap-1.5 pl-[42px] pt-1.5 text-sm">
          {v.flagged_report_ids.length > 0 && (
            <span className="text-xs text-rose-700">
              {t('Not clean')}: {v.flagged_report_ids.map((id) => titleById.get(id) || t('Waste point')).join(', ')}
            </span>
          )}
          {v.note && <span className="whitespace-pre-wrap">{v.note}</span>}
          {v.photo_url && <Thumb url={v.photo_url} className="size-16" />}
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
});

/**
 * "View results" of a meeting point: the voters, in three tabs (all, clean, not clean) with their
 * counts. Everyone who can open the verification page sees them.
 */
export const MeetingPointVotesPopover = memo(function MeetingPointVotesPopover({
  votes,
  titleById,
}: {
  votes: IMeetingPointVote[];
  titleById: Map<string, string>;
}) {
  const { t } = useTranslation('common');
  const [tab, setTab] = useState<Tab>('all');
  const lists: Record<Tab, IMeetingPointVote[]> = {
    all: votes,
    up: votes.filter((v) => v.value === 'up'),
    down: votes.filter((v) => v.value === 'down'),
  };
  const tabs: [Tab, string][] = [
    ['all', t('All')],
    ['up', t('Clean')],
    ['down', t('Not clean')],
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm text-button-accent underline underline-offset-2 hover:opacity-80"
        >
          <TbChartBar className="size-4" aria-hidden />
          {t('View results')}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={16}
        className="flex max-h-[min(70vh,var(--radix-popover-content-available-height))] w-[min(420px,calc(100vw-32px))] flex-col overflow-y-auto p-4"
      >
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="w-full rounded-[8px] border border-[rgba(136,122,71,0.5)] bg-background-primary/10">
            {tabs.map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="h-full flex-1 rounded-[8px] px-2 py-1 !text-xs data-active:bg-background data-active:shadow-sm"
              >
                {label} ({lists[value].length})
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map(([value]) => (
            <TabsContent key={value} value={value} className="mt-1">
              {lists[value].length === 0 ? (
                <p className="py-3 text-sm text-foreground-tertiary">{t('No votes yet')}</p>
              ) : (
                <ul className="divide-y divide-[rgba(136,122,71,0.2)]">
                  {lists[value].map((v) => (
                    <VoteRow key={v.user_id} vote={v} titleById={titleById} showSide={value === 'all'} />
                  ))}
                </ul>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
});
