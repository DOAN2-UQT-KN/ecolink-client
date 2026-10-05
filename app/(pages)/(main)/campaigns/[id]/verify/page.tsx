import { memo, useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Inbox } from 'lucide-react';
import { HiMapPin } from 'react-icons/hi2';
import { TbArrowLeft, TbPhotoPlus, TbThumbDown, TbThumbUp } from 'react-icons/tb';

import {
  useCampaignVerification,
  useUnvoteMeetingPoint,
  useVoteMeetingPoint,
  type IMeetingPointView,
  type IVerificationTrashPoint,
  type MeetingPointCannotVote,
  type MeetingPointDecisionCode,
  type MeetingPointVoteValue,
} from '@/apis/campaign/verification';
import { uploadToCloudinary } from '@/app/(pages)/(main)/incidents/create/_services/upload.service';
import { Breadcrumbs, type BreadcrumbItemProps } from '@/components/client/shared/Breadcrumbs';
import { Button } from '@/components/client/shared/Button';
import { sectionCardClass } from '@/components/client/shared/CollapsibleCard';
import { Checkbox } from '@/components/ui/checkbox';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { Pill } from '@/components/ui/Pill';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { apiErrorMessage } from '@/constants/apiErrorMessages';
import { CAMPAIGN_STATUS } from '@/constants/campaignLifecycle';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';
import { Link, useParams, useSearchParams } from '@/libs/router';
import { cn } from '@/libs/utils';
import { formattedDate } from '@/utils/formattedDate';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';

import {
  checksByUrl,
  Layer1LevelBadge,
  Layer1Summary,
  meetingPointLabel,
  MeetingPointStatusPill,
  TrashPointResultPill,
} from '../_components/ResultVerificationBadges';
import { MeetingPointDecisionActions } from '../_components/MeetingPointDecisionActions';
import { MeetingPointVotesPopover } from '../_components/MeetingPointVotesPopover';
import { CheckedThumb, Thumb } from '../_components/ShiftResultView';
import { CampaignDetailProvider } from '../_context/CampaignDetailContext';
import { useCampaignDetail } from '../_hooks/useCampaignDetail';

const NOTE_MAX = 1000;

/** English sentences; translate with `t()`. */
const CANNOT_VOTE_LABEL: Record<MeetingPointCannotVote, string> = {
  closed: 'Voting on this meeting point is closed.',
  org_member: 'Members of the organization running the campaign cannot vote.',
  campaign_manager: "The campaign's managers cannot vote.",
  volunteer: 'Volunteers who attended the campaign cannot vote.',
};

const DECISION_LABEL: Record<MeetingPointDecisionCode, string> = {
  score: 'Enough confirmations',
  layer1_pass: 'No objection and the photos passed the check',
  layer1_fail: 'The photos failed the automatic check',
  flag_timeout: 'The admin did not decide in time',
  admin: 'Decided by the admin',
};

/** The device's position, or null when it is refused or unavailable (the vote then counts as online). */
function currentPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 0,
    });
  });
}

/** Re-renders every minute for the countdowns. */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function useRemaining() {
  const { t } = useTranslation('common');
  return (iso: string, now: number) => {
    const minutes = Math.max(0, Math.round((new Date(iso).getTime() - now) / 60_000));
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? t('{{h}} h {{m}} min', { h, m }) : t('{{m}} min', { m });
  };
}

/** One trash point of a meeting point: photos with their checks, how it was declared, Layer 1. */
const TrashPointItem = memo(function TrashPointItem({
  trashPoint,
  title,
  failed,
}: {
  trashPoint: IVerificationTrashPoint;
  title: string;
  /** The meeting point was rejected and this trash point did not pass. */
  failed: boolean;
}) {
  const { t } = useTranslation('common');
  const checks = useMemo(() => checksByUrl(trashPoint.layer1), [trashPoint.layer1]);
  const inRound = trashPoint.status === 'cleaned';
  return (
    <li
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-[rgba(136,122,71,0.25)] bg-white/60 p-3',
        !inRound && 'opacity-80',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-1.5">
            <Link
              href={`/incidents/${trashPoint.report_id}`}
              className="font-medium text-button-accent underline-offset-2 hover:underline"
            >
              {title}
            </Link>
            {trashPoint.is_mine && <Pill tone="brand">{t('You reported this')}</Pill>}
          </span>
          {trashPoint.report?.detail_address && (
            <span className="text-xs text-foreground-tertiary">{trashPoint.report.detail_address}</span>
          )}
        </div>
        <span className="flex flex-wrap items-center gap-1.5">
          {failed && <Pill tone="red">{t('Did not pass')}</Pill>}
          <TrashPointResultPill status={trashPoint.status} />
        </span>
      </div>
      {!inRound && (
        <p className="text-xs text-foreground-tertiary">{t('Not declared cleaned: shown for reference, not voted on.')}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ['Before', trashPoint.before_urls],
            ['After', trashPoint.after_urls],
          ] as const
        ).map(([label, urls]) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="text-xs text-foreground-tertiary">{t(label)}</span>
            {urls.length === 0 ? (
              <span className="text-sm text-foreground-tertiary">—</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {urls.map((u) =>
                  trashPoint.layer1 ? (
                    <CheckedThumb key={u} url={u} check={checks.get(u) ?? null} />
                  ) : (
                    <Thumb key={u} url={u} />
                  ),
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {trashPoint.layer1 && <Layer1Summary layer1={trashPoint.layer1} />}
    </li>
  );
});

/**
 * One meeting point: where it is, its status and window, the votes, its trash points (the viewer's
 * own first), one "clean" / "not clean" vote for the whole meeting point, and (managers, admin)
 * the score and every vote; flagged → the admin decides.
 */
const MeetingPointCard = memo(function MeetingPointCard({
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
  const queryClient = useQueryClient();
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
  const [downOpen, setDownOpen] = useState(false);
  const [note, setNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const initialFlagged = (): string[] =>
    point.my_vote?.flagged_report_ids.length
      ? point.my_vote.flagged_report_ids
      : cleaned.length === 1
        ? [cleaned[0].report_id]
        : [];
  const [flagged, setFlagged] = useState<string[]>(initialFlagged);
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [formError, setFormError] = useState('');
  /** Which button's request is running: a vote side, the form's submit, or taking a vote back. */
  const [acting, setActing] = useState<MeetingPointVoteValue | 'submit' | null>(null);

  const { mutate: unvoteMutate, isPending: unvoting } = useUnvoteMeetingPoint({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      cancelDown();
      showMessage({ type: MessageType.Toast, level: MessageLevel.Success, title: t('Your vote was removed') });
    },
    onSettled: () => setActing(null),
  });

  const { mutate, isPending } = useVoteMeetingPoint({
    onSettled: () => setActing(null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      setDownOpen(false);
      setFormError('');
      showMessage({ type: MessageType.Toast, level: MessageLevel.Success, title: t('Your vote was saved') });
    },
  });

  /** Close the "not clean" form and drop what was typed in it. */
  const cancelDown = () => {
    setDownOpen(false);
    setNote('');
    setPhotoUrl(null);
    setFlagged(initialFlagged());
    setFormError('');
  };

  const vote = async (value: MeetingPointVoteValue) => {
    if (value === 'down') {
      if (flagged.length === 0) {
        setFormError(t('Pick at least one waste point that is not clean.'));
        return;
      }
      if (!note.trim() && !photoUrl) {
        setFormError(t('Add a note or a photo to say what is not clean.'));
        return;
      }
    }
    setFormError('');
    setActing(value === 'down' ? 'submit' : 'up');
    setLocating(true);
    const pos = await currentPosition();
    setLocating(false);
    mutate({
      campaign_id: campaignId,
      meeting_point_id: point.meeting_point_id,
      value,
      ...(value === 'down'
        ? {
            report_ids: flagged,
            ...(note.trim() ? { note: note.trim() } : {}),
            ...(photoUrl ? { photo_url: photoUrl } : {}),
          }
        : {}),
      ...(pos
        ? { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }
        : {}),
    });
  };

  const onPickPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showMessage({ type: MessageType.Toast, level: MessageLevel.Warning, title: t('Use images only.') });
      return;
    }
    setUploading(true);
    try {
      setPhotoUrl(await uploadToCloudinary(file));
      setFormError('');
    } catch {
      showMessage({ type: MessageType.Toast, level: MessageLevel.Error, title: t('Failed to upload some media.') });
    } finally {
      setUploading(false);
    }
  };

  const toggleFlagged = (id: string, on: boolean) => {
    setFlagged((prev) => (on ? [...prev, id] : prev.filter((x) => x !== id)));
    if (formError) setFormError('');
  };

  const busy = isPending || unvoting || locating;
  const my = point.my_vote;
  // The side shown as chosen: the open "not clean" form wins over the saved vote.
  const selected: MeetingPointVoteValue | null = downOpen ? 'down' : (my?.value ?? null);

  /** Clicking the side of one's saved vote takes it back. */
  const unvote = (side: MeetingPointVoteValue) => {
    setActing(side);
    unvoteMutate({ campaign_id: campaignId, meeting_point_id: point.meeting_point_id });
  };

  const onClickClean = () => {
    if (my?.value === 'up' && !downOpen) return unvote('up');
    if (downOpen) cancelDown();
    void vote('up');
  };

  const onClickNotClean = () => {
    if (my?.value === 'down') return unvote('down');
    if (downOpen) return cancelDown();
    setDownOpen(true);
    setFormError('');
  };
  const pointCannotVote =
    point.cannot_vote_reason && point.cannot_vote_reason !== globalCannotVote ? point.cannot_vote_reason : null;
  const firstWithCoords = point.trash_points.find((tp) => tp.report?.latitude != null && tp.report?.longitude != null);
  const lat = point.latitude ?? firstWithCoords?.report?.latitude ?? null;
  const lng = point.longitude ?? firstWithCoords?.report?.longitude ?? null;
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
                        onClick={onClickClean}
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
                        onClick={onClickNotClean}
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
                    <div className="flex flex-col gap-2 rounded-lg border border-[rgba(136,122,71,0.3)] bg-white/70 p-3">
                      <span className="text-sm font-medium">
                        {t('Which waste points are not clean?')} <span className="text-destructive">*</span>
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {cleaned.map((tp) => {
                          const id = `flag-${point.meeting_point_id}-${tp.report_id}`;
                          return (
                            <label key={tp.report_id} htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
                              <Checkbox
                                id={id}
                                checked={flagged.includes(tp.report_id)}
                                disabled={busy}
                                onCheckedChange={(v) => toggleFlagged(tp.report_id, v === true)}
                              />
                              {titleById.get(tp.report_id)}
                            </label>
                          );
                        })}
                      </div>
                      <span className="text-sm font-medium">{t('What is not clean? Add a note or a photo.')}</span>
                      <Textarea
                        rows={3}
                        value={note}
                        maxLength={NOTE_MAX}
                        placeholder={t('Describe what is still there')}
                        onChange={(e) => {
                          setNote(e.target.value);
                          if (formError) setFormError('');
                        }}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        {photoUrl && <Thumb url={photoUrl} onRemove={() => setPhotoUrl(null)} />}
                        {!photoUrl && (
                          <label
                            className={cn(
                              'inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-[rgba(136,122,71,0.6)] px-3 py-2 text-sm text-button-accent hover:bg-white/70',
                              uploading && 'pointer-events-none opacity-60',
                            )}
                          >
                            <TbPhotoPlus className="size-4" aria-hidden />
                            {uploading ? `${t('Uploading')}…` : t('Add a photo')}
                            <input type="file" accept="image/*" className="hidden" onChange={onPickPhoto} disabled={uploading} />
                          </label>
                        )}
                      </div>
                      {formError && <p className="text-xs text-destructive">{formError}</p>}
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outlined-brown" size="medium" isDisabled={busy} onClick={cancelDown}>
                          {t('Cancel')}
                        </Button>
                        <Button
                          type="button"
                          variant="brown"
                          size="medium"
                          className="w-fit"
                          isLoading={acting === 'submit'}
                          isDisabled={busy || uploading}
                          onClick={() => void vote('down')}
                        >
                          {t('Submit')}
                        </Button>
                      </div>
                    </div>
                  )}
                {locating && <p className="text-xs text-foreground-tertiary">{t('Getting your location…')}</p>}
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

/**
 * Result verification of a campaign marked done (Layers 2 and 3), per meeting point: its waste
 * points with their photos and automatic check; residents say "clean" or "not clean" (with a note
 * or a photo, naming the waste points that are not clean), weighted by where they are. Managers
 * and admins also see the score and every vote. `?point=` scrolls to a meeting point; `?report=`
 * to the meeting point holding that waste point (notification links).
 */
function VerifyBody() {
  const { t } = useTranslation('common');
  const { title: localizedTitle } = useLocalizedDisplay();
  const searchParams = useSearchParams();
  const focusPointParam = searchParams.get('point');
  const focusReport = searchParams.get('report');
  const { campaignId, campaign } = useCampaignDetail();
  const { data, isLoading, isError, error } = useCampaignVerification(campaignId, {
    enabled: Boolean(campaignId),
    retry: false,
  });
  const view = data?.data;
  const now = useNow();

  const reportById = useMemo(() => new Map((campaign?.reports ?? []).map((r) => [r.id, r])), [campaign?.reports]);
  const titleOf = useCallback(
    (tp: IVerificationTrashPoint) => {
      const r = reportById.get(tp.report_id);
      return (r && localizedTitle(r).trim()) || tp.report?.title || t('Waste point');
    },
    [reportById, localizedTitle, t],
  );
  const labelOf = (point: IMeetingPointView, fallbackIndex: number) => {
    const index = (campaign?.meeting_points ?? []).findIndex((p) => p.id === point.meeting_point_id);
    return meetingPointLabel(point.name, index >= 0 ? index : fallbackIndex, t);
  };

  // The meeting point a notification pointed at: by id, or the one holding the waste point.
  const meetingPoints = view?.meeting_points;
  const focusPoint = useMemo(() => {
    if (focusPointParam) return focusPointParam;
    if (!focusReport || !meetingPoints) return null;
    return (
      meetingPoints.find((mp) => mp.trash_points.some((tp) => tp.report_id === focusReport))?.meeting_point_id ?? null
    );
  }, [focusPointParam, focusReport, meetingPoints]);

  // Scroll to it once the list is there.
  const pointCount = meetingPoints?.length ?? 0;
  useEffect(() => {
    if (!focusPoint || pointCount === 0) return;
    const el = document.getElementById(`mp-${focusPoint}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusPoint, pointCount]);

  const campaignTitle = campaign ? localizedTitle(campaign).trim() || t('Campaign') : t('Campaign');
  const breadcrumbs: BreadcrumbItemProps[] = [
    { label: t('Home'), path: '/', type: 'link' },
    { label: t('Campaigns'), path: '/campaigns', type: 'link' },
    { label: campaignTitle, path: `/campaigns/${campaignId}`, type: 'link' },
    { label: t('Verify the result'), path: `/campaigns/${campaignId}/verify`, type: 'page' },
  ];

  const completed = view?.campaign_status === CAMPAIGN_STATUS.COMPLETED;

  return (
    <div className="max-w-5xl mx-auto w-full px-4 lg:px-8 pb-10 animate-in fade-in duration-500">
      <Breadcrumbs breadcrumbs={breadcrumbs} />
      <div className="flex flex-col gap-5 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display-7 font-semibold !text-button-accent">{t('Verify the result')}</h2>
              <InfoTooltip
                content={t(
                  'Did the team really clean these places? Each meeting point lists its waste points with photos before and after: look at them, or go and see, then vote once for the meeting point. It is verified after 72 hours, or earlier once enough people confirm it.',
                )}
                label={t('How verification works')}
                contentClassName="max-w-sm"
              />
            </div>
            <p className="text-sm text-foreground-secondary">{campaignTitle}</p>
          </div>
          <Link
            href={`/campaigns/${campaignId}`}
            className="inline-flex items-center gap-1 text-sm text-button-accent hover:underline"
          >
            <TbArrowLeft className="size-4" aria-hidden />
            {t('Back to the campaign')}
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : isError || !view ? (
          <div className="flex justify-center pt-10">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Inbox className="h-12 w-12 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>{t('Result verification is not open for this campaign')}</EmptyTitle>
                <EmptyDescription>
                  {(error && apiErrorMessage(error, t)) ||
                    t('It opens once the campaign is marked done, and stays visible after it is completed.')}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <>
            {completed && (
              <div className="rounded-lg border border-[rgba(136,122,71,0.3)] bg-white/70 px-4 py-3 text-sm text-foreground-secondary">
                {t('The campaign is completed. The votes below are kept for the record.')}
              </div>
            )}
            {view.awaiting_admin && (
              <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {view.awaiting_admin_reason === 'no_cleaned_points'
                  ? t('No waste point was declared cleaned: the admin decides whether the campaign is completed.')
                  : t('The completion was not accepted {{n}} times: the admin now decides.', {
                      n: view.rejection_count,
                    })}
              </div>
            )}
            {view.cannot_vote_reason && !completed && (
              <p className="text-sm text-foreground-tertiary">{t(CANNOT_VOTE_LABEL[view.cannot_vote_reason])}</p>
            )}
            {view.meeting_points.length === 0 ? (
              <p className="text-sm text-foreground-tertiary">{t('No meeting point is being verified.')}</p>
            ) : (
              view.meeting_points.map((point, index) => (
                <MeetingPointCard
                  key={point.verification_id}
                  campaignId={campaignId}
                  point={point}
                  label={labelOf(point, index)}
                  titleOf={titleOf}
                  highlighted={focusPoint === point.meeting_point_id}
                  globalCannotVote={view.cannot_vote_reason}
                  canSeeVotes={view.can_see_votes}
                  canDecide={view.can_decide}
                  now={now}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CampaignVerifyPage() {
  const { id } = useParams() as { id: string };
  return (
    <CampaignDetailProvider campaignId={id}>
      <VerifyBody />
    </CampaignDetailProvider>
  );
}
