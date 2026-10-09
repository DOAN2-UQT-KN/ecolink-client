import type {
  IResultPhotoCheck,
  IShiftMedia,
  IShiftResultReport,
  IShiftResultView,
  ResultCheckLevel,
  SaveShiftResultParams,
} from '@/apis/campaign/shiftResult';
import type { IIncident } from '@/apis/incident/models/incident';
import type { ReportChoice } from '@/constants/campaignVerification';

/** Files picked at once, and the video size limit. */
export const MAX_RESULT_MEDIA = 20;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_PHOTOS_PER_SIDE = 10;
/** Waste point photos go up as originals (the server reads their EXIF): at most 15 MB each. */
export const MAX_RESULT_PHOTO_BYTES = 15 * 1024 * 1024;
const LEVEL_RANK: Record<ResultCheckLevel, number> = { pass: 0, warn: 1, fail: 2 };

export type ReportDraft = { status: ReportChoice; before: string[]; after: string[] };
export type PhotoChecks = Record<string, IResultPhotoCheck | null>;
export type UploadedMedia = { url: string; kind: 'image' | 'video' };

export const isImageFile = (file: File) => file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name);

/** The worst Layer 1 level among the photos; a photo without a check counts as "warn". */
export function worstLevel(photos: string[], checks: PhotoChecks): ResultCheckLevel {
  return photos.reduce<ResultCheckLevel>((acc, u) => {
    const level = checks[u]?.level ?? 'warn';
    return LEVEL_RANK[level] > LEVEL_RANK[acc] ? level : acc;
  }, 'pass');
}

export const sameUrls = (a: string[], b: string[]) => a.join('\n') === b.join('\n');

export function defaultPinOf(incident: IIncident | undefined) {
  return incident?.latitude != null && incident?.longitude != null
    ? { lat: incident.latitude, lng: incident.longitude }
    : null;
}

export type ShiftResultFormState = {
  drafts: Record<string, ReportDraft>;
  checks: PhotoChecks;
  picked: Set<string>;
  description: string;
  bags: string;
  kg: string;
};

/** The form, filled from the saved result. */
export function formFromView(view: IShiftResultView): ShiftResultFormState {
  const drafts: Record<string, ReportDraft> = {};
  const checks: PhotoChecks = {};
  for (const r of view.result?.reports ?? []) {
    drafts[r.report_id] = { status: r.status, before: r.before_urls, after: r.after_urls };
    for (const p of r.layer1?.photos ?? []) checks[p.url] = p.check;
  }
  return {
    drafts,
    checks,
    picked: new Set(view.media.filter((m) => m.included_in_result).map((m) => m.id)),
    description: view.result?.description ?? '',
    bags: view.result?.waste_bags != null ? String(view.result.waste_bags) : '',
    kg: view.result?.waste_kg != null ? String(view.result.waste_kg) : '',
  };
}

/** The save request, or the i18n key of what is missing. */
export function buildSavePayload(
  params: { campaign_id: string; shift_id: string },
  reportIds: string[],
  media: IShiftMedia[],
  form: Omit<ShiftResultFormState, 'checks'>,
): { error: string } | { payload: SaveShiftResultParams } {
  const { drafts, picked, description, bags, kg } = form;
  const listed: IShiftResultReport[] = [];
  for (const id of reportIds) {
    const d = drafts[id];
    if (!d || d.status === 'none') continue;
    if (d.after.length === 0) return { error: 'Each handled waste point needs at least one photo after.' };
    listed.push({ report_id: id, status: d.status, before_urls: d.before, after_urls: d.after });
  }
  if (!description.trim()) return { error: 'A description is required.' };
  const mediaIds = media.filter((m) => picked.has(m.id)).map((m) => m.id);
  if (listed.length === 0 && mediaIds.length === 0) {
    return { error: 'Add at least one handled waste point or one photo of the activity.' };
  }
  return {
    payload: {
      ...params,
      description: description.trim(),
      waste_bags: bags.trim() === '' ? null : Math.max(0, Math.round(Number(bags))),
      waste_kg: kg.trim() === '' ? null : Math.max(0, Number(kg)),
      reports: listed,
      media_ids: mediaIds,
    },
  };
}
