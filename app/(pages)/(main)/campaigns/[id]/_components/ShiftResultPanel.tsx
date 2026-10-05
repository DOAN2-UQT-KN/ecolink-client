import { memo, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { TbFlagCheck, TbPencil, TbPhotoPlus, TbVideo } from 'react-icons/tb';

import type { LatLngLiteral } from 'leaflet';

import {
  useAddShiftMedia,
  useEndShiftEarly,
  useRemoveShiftMedia,
  useSaveShiftResult,
  useShiftResult,
  useUploadResultPhoto,
  type IResultPhotoCheck,
  type IShiftMedia,
  type IShiftResultReport,
  type ResultCheckLevel,
  type ResultPhotoSide,
} from '@/apis/campaign/shiftResult';
import type { IIncident } from '@/apis/incident/models/incident';
import { uploadToCloudinary } from '@/app/(pages)/(main)/incidents/create/_services/upload.service';
import { Button } from '@/components/client/shared/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Pill } from '@/components/ui/Pill';
import { Textarea } from '@/components/ui/textarea';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';
import { compressImage } from '@/libs/compressImage';
import { cn } from '@/libs/utils';
import { ConfirmPopoverModal } from '@/modules/OrganizationCard/components/ConfirmPopoverModal';
import useAuthStore from '@/stores/useAuthStore';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';
import { ShiftReopenedNotice, ShiftReopenedPill, ShiftStatusPill } from './ShiftStatusPill';
import { CheckedThumb, REPORT_LABEL, ShiftResultView, Thumb, type ReportChoice } from './ShiftResultView';
import { CHECK_LEVEL_LABEL, CHECK_LEVEL_TONE, Layer1Summary } from './ResultVerificationBadges';
import { ResultPhotoPinDialog } from './ResultPhotoPinDialog';

/** Files picked at once, and the video size limit. */
const MAX_RESULT_MEDIA = 20;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_PHOTOS_PER_SIDE = 10;
/** Waste point photos go up as originals (the server reads their EXIF): at most 15 MB each. */
const MAX_RESULT_PHOTO_BYTES = 15 * 1024 * 1024;
const LEVEL_RANK: Record<ResultCheckLevel, number> = { pass: 0, warn: 1, fail: 2 };

const isImageFile = (file: File) => file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name);

type ReportDraft = { status: ReportChoice; before: string[]; after: string[] };

/** Uploads picked photos (compressed) and videos (≤ 100 MB) to Cloudinary. */
async function uploadPicked(
  files: File[],
  t: (key: string, options?: Record<string, unknown>) => string,
  allowVideo: boolean,
): Promise<Array<{ url: string; kind: 'image' | 'video' }>> {
  const out: Array<{ url: string; kind: 'image' | 'video' }> = [];
  for (const file of files.slice(0, MAX_RESULT_MEDIA)) {
    if (allowVideo && file.type.startsWith('video/')) {
      if (file.size > MAX_VIDEO_BYTES) {
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Error,
          title: t('Video must be at most {{mb}} MB.', { mb: 100 }),
        });
        continue;
      }
      out.push({ url: await uploadToCloudinary(file), kind: 'video' });
    } else if (file.type.startsWith('image/')) {
      out.push({ url: await uploadToCloudinary(await compressImage(file)), kind: 'image' });
    } else {
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Warning,
        title: allowVideo ? t('Unsupported file type. Use images or video.') : t('Use images only.'),
      });
    }
  }
  return out;
}

/** A file button that uploads what is picked and hands back the URLs. */
function UploadButton({
  label,
  accept,
  allowVideo,
  disabled,
  onUploaded,
}: {
  label: string;
  accept: string;
  allowVideo: boolean;
  disabled?: boolean;
  onUploaded: (items: Array<{ url: string; kind: 'image' | 'video' }>) => Promise<void> | void;
}) {
  const { t } = useTranslation('common');
  const [busy, setBusy] = useState(false);
  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    if (files.length > MAX_RESULT_MEDIA) {
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Warning,
        title: t('Only {{count}} files were added because of the limit.', { count: MAX_RESULT_MEDIA }),
      });
    }
    setBusy(true);
    try {
      const items = await uploadPicked(files, t, allowVideo);
      if (items.length > 0) await onUploaded(items);
    } catch (error) {
      console.error('Shift media upload failed', error);
      showMessage({ type: MessageType.Toast, level: MessageLevel.Error, title: t('Failed to upload some media.') });
    } finally {
      setBusy(false);
    }
  };
  return (
    <label
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-[rgba(136,122,71,0.6)] px-3 py-2 text-sm text-button-accent hover:bg-white/70',
        (busy || disabled) && 'pointer-events-none opacity-60',
      )}
    >
      <TbPhotoPlus className="size-4" aria-hidden />
      {busy ? `${t('Uploading')}…` : label}
      <input type="file" className="hidden" accept={accept} multiple onChange={onChange} disabled={busy || disabled} />
    </label>
  );
}

/**
 * Photos before / after of a waste point (result verification, Layer 1): picked, pinned on the map
 * (starting at the waste point), then uploaded one by one as originals; the server grades each.
 */
function ResultPhotoButton({
  campaignId,
  shiftId,
  reportId,
  side,
  remaining,
  defaultPin,
  pointTitle,
  onUploaded,
}: {
  campaignId: string;
  shiftId: string;
  reportId: string;
  side: ResultPhotoSide;
  remaining: number;
  defaultPin: LatLngLiteral | null;
  pointTitle: string;
  onUploaded: (items: Array<{ url: string; check: IResultPhotoCheck }>) => void;
}) {
  const { t } = useTranslation('common');
  const [pending, setPending] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const { mutateAsync: upload } = useUploadResultPhoto();

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const ok: File[] = [];
    for (const file of files) {
      if (!isImageFile(file)) {
        showMessage({ type: MessageType.Toast, level: MessageLevel.Warning, title: t('Use images only.') });
      } else if (file.size > MAX_RESULT_PHOTO_BYTES) {
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Error,
          title: t('{{name}} is larger than {{mb}} MB.', { name: file.name, mb: 15 }),
        });
      } else {
        ok.push(file);
      }
    }
    if (ok.length > remaining) {
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Warning,
        title: t('Only {{count}} files were added because of the limit.', { count: remaining }),
      });
    }
    setPending(ok.slice(0, remaining));
  };

  const onPin = async (pin: LatLngLiteral) => {
    const files = pending;
    setPending([]);
    setBusy(true);
    const out: Array<{ url: string; check: IResultPhotoCheck }> = [];
    try {
      for (const file of files) {
        try {
          const res = await upload({
            campaign_id: campaignId,
            shift_id: shiftId,
            file,
            report_id: reportId,
            side,
            pin_lat: pin.lat,
            pin_lng: pin.lng,
          });
          out.push(res.data);
        } catch {
          // The error is already shown; carry on with the other photos.
        }
      }
    } finally {
      setBusy(false);
      if (out.length > 0) onUploaded(out);
    }
  };

  return (
    <>
      <label
        className={cn(
          'inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-[rgba(136,122,71,0.6)] px-3 py-2 text-sm text-button-accent hover:bg-white/70',
          busy && 'pointer-events-none opacity-60',
        )}
      >
        <TbPhotoPlus className="size-4" aria-hidden />
        {busy ? `${t('Uploading')}…` : t('Add photos')}
        <input type="file" className="hidden" accept="image/*,.heic,.heif" multiple onChange={onChange} disabled={busy} />
      </label>
      <ResultPhotoPinDialog
        open={pending.length > 0}
        count={pending.length}
        defaultPin={defaultPin}
        pointTitle={pointTitle}
        onCancel={() => setPending([])}
        onConfirm={(pin) => void onPin(pin)}
      />
    </>
  );
}

/**
 * The result of one shift (spec 4.2). Its leader or a campaign manager fills it once the shift
 * has started: each waste point of the meeting point (cleaned / partly done / not handled, with
 * photos before and after), photos picked from the shift's pool, a description and the amount
 * collected; they can end the shift early once a result is saved. Volunteers who attended see it
 * and add their photos to the pool. Everyone else sees the status only.
 */
export const ShiftResultPanel = memo(function ShiftResultPanel({
  campaignId,
  shiftId,
  reports,
  className,
}: {
  campaignId: string;
  shiftId: string;
  /** Waste points of the shift's meeting point. */
  reports: IIncident[];
  className?: string;
}) {
  const { t } = useTranslation('common');
  const { title: localizedTitle } = useLocalizedDisplay();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const params = { campaign_id: campaignId, shift_id: shiftId };
  const { data, isLoading, isError } = useShiftResult(params);
  const view = data?.data;
  // Everyone sees the result read-only; whoever may edit opens the form with "Edit".
  const [editing, setEditing] = useState(false);

  const refreshCampaign = () => {
    void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
    void queryClient.invalidateQueries({ queryKey: ['shift-overview', campaignId] });
  };
  const { mutate: save, isPending: isSaving } = useSaveShiftResult({
    onSuccess: () => {
      refreshCampaign();
      setEditing(false);
      showMessage({ type: MessageType.Toast, level: MessageLevel.Success, title: t('Shift result saved') });
    },
  });
  const { mutateAsync: endEarly, isPending: isEnding } = useEndShiftEarly({
    onSuccess: (res) => {
      refreshCampaign();
      void queryClient.invalidateQueries({ queryKey: ['shift-attendance'] });
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Success,
        title: t('Shift ended; {{n}} person(s) checked out', { n: res.data.checked_out }),
      });
    },
  });
  const { mutateAsync: addMedia } = useAddShiftMedia();
  const { mutate: removeMedia } = useRemoveShiftMedia();

  // The form, filled from the saved result.
  const [drafts, setDrafts] = useState<Record<string, ReportDraft>>({});
  /** Layer 1 checks of the waste point photos: saved ones from the result, new ones from the upload. */
  const [checks, setChecks] = useState<Record<string, IResultPhotoCheck | null>>({});
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [description, setDescription] = useState('');
  const [bags, setBags] = useState('');
  const [kg, setKg] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const savedAt = view?.result?.updated_at;
  const resetForm = () => {
    if (!view) return;
    const next: Record<string, ReportDraft> = {};
    const nextChecks: Record<string, IResultPhotoCheck | null> = {};
    for (const r of view.result?.reports ?? []) {
      next[r.report_id] = { status: r.status, before: r.before_urls, after: r.after_urls };
      for (const p of r.layer1?.photos ?? []) nextChecks[p.url] = p.check;
    }
    setDrafts(next);
    setChecks(nextChecks);
    setPicked(new Set(view.media.filter((m) => m.included_in_result).map((m) => m.id)));
    setDescription(view.result?.description ?? '');
    setBags(view.result?.waste_bags != null ? String(view.result.waste_bags) : '');
    setKg(view.result?.waste_kg != null ? String(view.result.waste_kg) : '');
    setFormError(null);
  };
  // Reset only when a result is (re)loaded, not on every pool change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(resetForm, [savedAt, view?.shift_id]);

  const reportById = useMemo(() => new Map(reports.map((r) => [r.id, r])), [reports]);
  const reportTitle = (id: string) => {
    const r = reportById.get(id);
    return (r && localizedTitle(r).trim()) || t('Waste point');
  };

  if (isLoading) return <div className={className}>{t('Loading')}…</div>;
  if (isError || !view) return null;

  const status = view.status;
  const started = status !== 'upcoming' && status !== 'off';
  const editable = view.can_edit && !view.locked && started;

  const header = (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display-6 font-semibold text-button-accent">{t('Shift result')}</h2>
          <ShiftStatusPill status={status} />
          {view.reopened_at && <ShiftReopenedPill reason={view.reopen_reason} />}
        </div>
        {view.ended_at && (
          <span className="text-xs text-foreground-tertiary">
            {t('Ended early at {{time}}', { time: format(new Date(view.ended_at), 'HH:mm') })}
          </span>
        )}
        {view.result && (
          <span className="text-xs text-foreground-tertiary">
            {t('Last saved {{time}}', { time: format(new Date(view.result.updated_at), 'PPp') })}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
      {editable && !editing && (
        <Button
          type="button"
          variant="brown"
          size="medium"
          iconLeft={<TbPencil className="size-4" aria-hidden />}
          onClick={() => {
            resetForm();
            setEditing(true);
          }}
        >
          {view.result ? t('Edit') : t('Submit result')}
        </Button>
      )}
      {editable && status === 'running' && view.result && (
        <ConfirmPopoverModal
          title={t('End this shift now?')}
          description={t(
            'The shift ends now: attendance closes and everyone still checked in is checked out. The 60% presence rule counts until now.',
          )}
          confirmLabel={t('End shift')}
          cancelLabel={t('Cancel')}
          confirmPending={isEnding}
          onConfirm={async () => {
            await endEarly(params);
          }}
          trigger={
            <Button
              type="button"
              variant="outlined-brown"
              size="medium"
              iconLeft={<TbFlagCheck className="size-4" aria-hidden />}
            >
              {t('End shift early')}
            </Button>
          }
        />
      )}
      </div>
      {view.reopened_at && <ShiftReopenedNotice reason={view.reopen_reason} className="w-full" />}
    </div>
  );

  const myMedia = (m: IShiftMedia) => m.uploaded_by === currentUserId;
  const pool = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{t('Shift activity photos')}</h3>
        {/* Volunteers who attended add photos any time; whoever edits the result does it in Edit. */}
        {((editing && editable) || (view.can_contribute && !view.can_edit && !view.locked)) && (
          <UploadButton
            label={t('Add photos or videos')}
            accept="image/*,video/*"
            allowVideo
            onUploaded={async (items) => {
              for (const item of items) await addMedia({ ...params, ...item });
            }}
          />
        )}
      </div>
      {editing && editable && view.media.length > 0 && (
        <p className="text-xs text-foreground-tertiary">{t('Tick the photos that go into the result.')}</p>
      )}
      {view.media.length === 0 ? (
        <p className="text-sm text-foreground-tertiary">{t('No photos yet')}</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {view.media.map((m) => (
            <div key={m.id} className="flex flex-col gap-1">
              <Thumb
                url={m.url}
                kind={m.kind}
                onRemove={
                  !view.locked && (editing && editable ? view.can_edit : myMedia(m))
                    ? () => removeMedia({ ...params, media_id: m.id })
                    : undefined
                }
                className={cn(picked.has(m.id) && 'ring-2 ring-emerald-500')}
              />
              {editing && editable ? (
                <label className="flex items-center gap-1.5 text-xs">
                  <Checkbox
                    checked={picked.has(m.id)}
                    onCheckedChange={(v) =>
                      setPicked((prev) => {
                        const next = new Set(prev);
                        if (v) next.add(m.id);
                        else next.delete(m.id);
                        return next;
                      })
                    }
                  />
                  {t('In result')}
                </label>
              ) : m.included_in_result ? (
                <Pill tone="green" className="w-fit">
                  {t('In result')}
                </Pill>
              ) : null}
              <span className="max-w-24 truncate text-[11px] text-foreground-tertiary">
                {m.kind === 'video' && <TbVideo className="mr-0.5 inline size-3" aria-hidden />}
                {myMedia(m) ? t('You') : m.uploader?.name || t('Volunteer')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (!editable || !editing) {
    return (
      <div className={className}>
        {header}
        <ShiftResultView
          result={view.result}
          reportIds={view.report_ids}
          started={started}
          reportTitle={reportTitle}
        />
        {/* Without can_view the server sends only the photos chosen for the result (public campaign). */}
        {(view.can_view || view.result) && pool}
      </div>
    );
  }

  const setDraft = (id: string, patch: Partial<ReportDraft>) =>
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { status: 'none', before: [], after: [] }), ...patch },
    }));

  const onSave = () => {
    const listed: IShiftResultReport[] = [];
    for (const id of view.report_ids) {
      const d = drafts[id];
      if (!d || d.status === 'none') continue;
      if (d.after.length === 0) {
        setFormError(t('Each handled waste point needs at least one photo after.'));
        return;
      }
      listed.push({ report_id: id, status: d.status, before_urls: d.before, after_urls: d.after });
    }
    if (!description.trim()) {
      setFormError(t('A description is required.'));
      return;
    }
    const mediaIds = view.media.filter((m) => picked.has(m.id)).map((m) => m.id);
    if (listed.length === 0 && mediaIds.length === 0) {
      setFormError(t('Add at least one handled waste point or one photo of the activity.'));
      return;
    }
    setFormError(null);
    save({
      ...params,
      description: description.trim(),
      waste_bags: bags.trim() === '' ? null : Math.max(0, Math.round(Number(bags))),
      waste_kg: kg.trim() === '' ? null : Math.max(0, Number(kg)),
      reports: listed,
      media_ids: mediaIds,
    });
  };

  return (
    <div className={className}>
      {header}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">{t('Waste points')}</h3>
          {view.report_ids.length === 0 ? (
            <p className="text-sm text-foreground-tertiary">{t('This meeting point has no waste points.')}</p>
          ) : (
            view.report_ids.map((id) => {
              const d = drafts[id] ?? { status: 'none' as const, before: [], after: [] };
              const saved = view.result?.reports.find((r) => r.report_id === id);
              const unchanged =
                saved != null &&
                saved.before_urls.join('\n') === d.before.join('\n') &&
                saved.after_urls.join('\n') === d.after.join('\n');
              const photos = [...d.before, ...d.after];
              const worst = photos.reduce<ResultCheckLevel>((acc, u) => {
                const level = checks[u]?.level ?? 'warn';
                return LEVEL_RANK[level] > LEVEL_RANK[acc] ? level : acc;
              }, 'pass');
              const incident = reportById.get(id);
              const defaultPin =
                incident?.latitude != null && incident?.longitude != null
                  ? { lat: incident.latitude, lng: incident.longitude }
                  : null;
              return (
                <div key={id} className="rounded-lg border border-[rgba(136,122,71,0.3)] bg-white/70 p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{reportTitle(id)}</span>
                    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={reportTitle(id)}>
                      {(['cleaned', 'partial', 'none'] as const).map((choice) => (
                        <button
                          key={choice}
                          type="button"
                          role="radio"
                          aria-checked={d.status === choice}
                          onClick={() => setDraft(id, { status: choice })}
                          className={cn(
                            'rounded-full border px-3 py-1 text-xs transition-colors',
                            d.status === choice
                              ? 'border-button-accent bg-button-accent text-white'
                              : 'border-[rgba(136,122,71,0.4)] hover:bg-white',
                          )}
                        >
                          {t(REPORT_LABEL[choice])}
                        </button>
                      ))}
                    </div>
                  </div>
                  {d.status !== 'none' &&
                    (unchanged && saved?.layer1 ? (
                      <Layer1Summary layer1={saved.layer1} className="mb-2" />
                    ) : photos.length > 0 ? (
                      <span className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-foreground-tertiary">
                        {t('Photo check')}
                        <Pill tone={CHECK_LEVEL_TONE[worst]}>{t(CHECK_LEVEL_LABEL[worst])}</Pill>
                        {t('The pair of photos is checked again when you save.')}
                      </span>
                    ) : null)}
                  {d.status !== 'none' && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(['before', 'after'] as const).map((side) => (
                        <div key={side} className="flex flex-col gap-1.5">
                          <span className="text-xs text-foreground-tertiary">
                            {side === 'before' ? `${t('Before')} ${t('(optional)')}` : t('After')}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {d[side].map((u) => (
                              <CheckedThumb
                                key={u}
                                url={u}
                                check={checks[u] ?? null}
                                onRemove={() => setDraft(id, { [side]: d[side].filter((x) => x !== u) })}
                              />
                            ))}
                          </div>
                          {d[side].length < MAX_PHOTOS_PER_SIDE && (
                            <ResultPhotoButton
                              campaignId={campaignId}
                              shiftId={shiftId}
                              reportId={id}
                              side={side}
                              remaining={MAX_PHOTOS_PER_SIDE - d[side].length}
                              defaultPin={defaultPin}
                              pointTitle={reportTitle(id)}
                              onUploaded={(items) => {
                                setChecks((prev) => {
                                  const next = { ...prev };
                                  for (const i of items) next[i.url] = i.check;
                                  return next;
                                });
                                setDrafts((prev) => {
                                  const cur = prev[id] ?? d;
                                  return {
                                    ...prev,
                                    [id]: {
                                      ...cur,
                                      [side]: [...cur[side], ...items.map((i) => i.url)].slice(0, MAX_PHOTOS_PER_SIDE),
                                    },
                                  };
                                });
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {pool}

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold">{t('Description')}</span>
            <Textarea
              value={description}
              maxLength={5000}
              rows={4}
              placeholder={t('What was done on this shift')}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <div className="grid max-w-md grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold">{t('Bags')}</span>
              <Input type="number" min={0} step={1} value={bags} onChange={(e) => setBags(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold">{t('Weight (kg)')}</span>
              <Input type="number" min={0} step="0.1" value={kg} onChange={(e) => setKg(e.target.value)} />
            </label>
          </div>
        </div>

        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outlined-brown"
            size="medium"
            isDisabled={isSaving}
            onClick={() => {
              resetForm();
              setEditing(false);
            }}
          >
            {t('Cancel')}
          </Button>
          <Button type="button" variant="brown" size="medium" isLoading={isSaving} isDisabled={isSaving} onClick={onSave}>
            {view.result ? t('Save result') : t('Submit result')}
          </Button>
        </div>
      </div>
    </div>
  );
});
