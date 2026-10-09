import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { HiMapPin } from 'react-icons/hi2';
import { TbThumbDown, TbThumbUp } from 'react-icons/tb';

import type { IMeetingPointView, IVerificationTrashPoint, MeetingPointCannotVote } from '@/apis/campaign/verification';
import { Button } from '@/components/client/shared/Button';
import { sectionCardClass } from '@/components/client/shared/CollapsibleCard';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { Pill } from '@/components/ui/Pill';
import { cn } from '@/libs/utils';
import { formattedDate } from '@/utils/formattedDate';
import {
  Layer1LevelBadge,
  MeetingPointDecisionActions,
  MeetingPointStatusPill,
  MeetingPointVotesPopover,
} from '@/modules/CampaignVerification';
import { useRemaining } from '../_hooks/useCountdown';
import { useMeetingPointVote } from '../_hooks/useMeetingPointVote';
import { CANNOT_VOTE_LABEL, DECISION_LABEL, meetingPointCoords } from '../_services/verification.service';
import { NotCleanForm } from './NotCleanForm';
import { TrashPointItem } from './TrashPointItem';

/**
 * One meeting point: where it is, its status and window, the votes, its trash points (the viewer's
 * own first), one "clean" / "not clean" vote for the whole meeting point, and (managers, admin)
 * the score and every vote; flagged → the admin decides.
 */
export const MeetingPointCard = memo(function MeetingPointCard({
  campaignId,
  point,
  label,
  titleOf,
  highlighted,
  globalCannotVote,
  canSeeVotes,
  canDecide,
  now,
}: {
  campaignId: string;
  point: IMeetingPointView;
  label: string;
  titleOf: (trashPoint: IVerificationTrashPoint) => string;
  highlighted: boolean;
  globalCannotVote: MeetingPointCannotVote | null;
  canSeeVotes: boolean;
  canDecide: boolean;
  now: number;
}) {
  const { t } = useTranslation('common');
  const remaining = useRemaining();
  const cleaned = useMemo(() => point.trash_points.filter((tp) => tp.status === 'cleaned'), [point.trash_points]);
  const titleById = useMemo(
    () => new Map(point.trash_points.map((tp) => [tp.report_id, titleOf(tp)])),
    [point.trash_points, titleOf],
  );
  const [open, setOpen] = useState(true);
  // A deep link (?point= / ?report=) always lands on an open card.
  useEffect(() => {
    if (highlighted) setOpen(true);
  }, [highlighted]);
  const form = useMeetingPointVote(campaignId, point, cleaned);
  const { busy, selected, acting, downOpen } = form;
  const my = point.my_vote;

  const pointCannotVote =
    point.cannot_vote_reason && point.cannot_vote_reason !== globalCannotVote ? point.cannot_vote_reason : null;
  const { lat, lng } = meetingPointCoords(point);
  const failedTitles = point.failed_report_ids.map((id) => titleById.get(id) || t('Waste point'));

  let timing: string | null = null;
  if (point.status === 'voting') {
    timing =
      new Date(point.window_ends_at).getTime() > now
        ? t('Voting closes in {{time}}', { time: remaining(point.window_ends_at, now) })
        : t('Voting has closed; the result is being decided');
  } else if (point.status === 'flagged' && point.flag_deadline) {
    timing = t('Waiting for the admin, at most {{time}} more', { time: remaining(point.flag_deadline, now) });
  } else if (point.decided_at) {
    timing = t('Decided on {{date}}', { date: formattedDate(point.decided_at, true) });
  }

  return (
    <section
      id={`mp-${point.meeting_point_id}`}
      className={cn(sectionCardClass, 'scroll-mt-24 flex flex-col gap-4', highlighted && 'ring-2 ring-button-accent')}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`mp-body-${point.meeting_point_id}`}
            onClick={() => setOpen((v) => !v)}
            className="flex min-w-0 items-center gap-2 text-left"
          >
            <motion.span
              animate={{ rotate: open ? 0 : -90 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 text-button-accent"
              aria-hidden
            >
              <ChevronDown className="size-5" />
            </motion.span>
            <h3 className="font-display-6 font-semibold text-button-accent">{label}</h3>
          </button>
          {(point.detail_address || (lat != null && lng != null)) && (
            <span className="flex items-center gap-1 text-sm text-foreground-secondary">
              <HiMapPin className="size-3.5 shrink-0" aria-hidden />
              {point.detail_address || `${lat}, ${lng}`}
              {lat != null && lng != null && (
                <a
                  href={`https://www.google.com/maps?q=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-xs text-button-accent underline"
                >
                  {t('View on map')}
                </a>
              )}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {point.round > 1 && <Pill tone="neutral">{t('Round {{n}}', { n: point.round })}</Pill>}
            <MeetingPointStatusPill status={point.status} />
          </div>
          {timing && <span className="text-xs text-foreground-tertiary">{timing}</span>}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`mp-body-${point.meeting_point_id}`}
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4">
              {(point.decision_code || point.decision_reason) && (
                <p className="text-sm text-foreground-secondary">
                  {point.decision_code && t(DECISION_LABEL[point.decision_code])}
                  {point.decision_reason && (
                    <>
                      {point.decision_code ? '. ' : ''}
                      {t('Reason')}: {point.decision_reason}
                    </>
                  )}
                </p>
              )}
              {point.status === 'rejected' && failedTitles.length > 0 && (
                <p className="text-sm text-red-700">
                  {t('Waste points that did not pass')}: {failedTitles.join(', ')}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Layer1LevelBadge level={point.layer1_level} />
                {canSeeVotes && point.score != null && (
                  <span className="text-foreground-secondary">
                    {t('Score')}: <span className="font-semibold tabular-nums">{point.score}</span> / 15
                  </span>
                )}
              </div>

              <ul className="flex flex-col gap-3">
                {point.trash_points.map((tp) => (
                  <TrashPointItem
                    key={tp.report_id}
                    trashPoint={tp}
                    title={titleById.get(tp.report_id) ?? t('Waste point')}
                    failed={point.status === 'rejected' && point.failed_report_ids.includes(tp.report_id)}
                  />
                ))}
              </ul>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {point.can_vote && (
                      <>
                      <Button
                        type="button"
                        variant={selected === 'up' ? 'brown' : 'outlined-brown'}
                        aria-pressed={selected === 'up'}
                        title={selected === 'up' ? t('Click again to remove your vote') : undefined}
                        size="medium"
                        iconLeft={<TbThumbUp className="size-4" aria-hidden />}
                        isDisabled={busy}
                        isLoading={acting === 'up'}
                        onClick={form.onClickClean}
                      >
                        {t('It is clean')}
                      </Button>
                      <Button
                        type="button"
                        variant={selected === 'down' ? 'brown' : 'outlined-brown'}
                        aria-pressed={my?.value === 'down'}
                        aria-expanded={downOpen}
                        title={my?.value === 'down' ? t('Click again to remove your vote') : undefined}
                        size="medium"
                        iconLeft={<TbThumbDown className="size-4" aria-hidden />}
                        isDisabled={busy}
                        isLoading={acting === 'down'}
                        onClick={form.onClickNotClean}
                      >
                        {t('Not clean yet')}
                      </Button>
                      {point.is_reporter && (
                        <InfoTooltip content={t('You reported a waste point here: your confirmation weighs 10.')} />
                      )}
                      </>
                    )}
                  </div>
                  <MeetingPointVotesPopover votes={point.votes} titleById={titleById} />
                </div>
                {downOpen && (
                  <NotCleanForm
                    meetingPointId={point.meeting_point_id}
                    cleaned={cleaned}
                    titleById={titleById}
                    form={form}
                  />
                )}
                {form.locating && <p className="text-xs text-foreground-tertiary">{t('Getting your location…')}</p>}
                {!point.can_vote && pointCannotVote && (
                  <p className="text-sm text-foreground-tertiary">{t(CANNOT_VOTE_LABEL[pointCannotVote])}</p>
                )}
              </div>

              {canDecide && point.status === 'flagged' && (
                <MeetingPointDecisionActions
                  campaignId={campaignId}
                  meetingPointId={point.meeting_point_id}
                  trashPoints={cleaned.map((tp) => ({ id: tp.report_id, title: titleById.get(tp.report_id) ?? '' }))}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
});
