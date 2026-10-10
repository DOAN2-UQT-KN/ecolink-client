import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  IResultPhotoCheck,
  IShiftResultView,
  ResultPhotoSide,
  SaveShiftResultParams,
} from '@/apis/campaign/models/shiftResult';
import {
  buildSavePayload,
  formFromView,
  MAX_PHOTOS_PER_SIDE,
  type PhotoChecks,
  type ReportDraft,
} from '../_services/shiftResult.service';

/** The shift result form: filled from the saved result, reset whenever a result is (re)loaded. */
export function useShiftResultForm(view: IShiftResultView | undefined) {
  const { t } = useTranslation('common');
  const [drafts, setDrafts] = useState<Record<string, ReportDraft>>({});
  /** Layer 1 checks of the waste point photos: saved ones from the result, new ones from the upload. */
  const [checks, setChecks] = useState<PhotoChecks>({});
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [description, setDescription] = useState('');
  const [bags, setBags] = useState('');
  const [kg, setKg] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const savedAt = view?.result?.updated_at;
  const resetForm = () => {
    if (!view) return;
    const next = formFromView(view);
    setDrafts(next.drafts);
    setChecks(next.checks);
    setPicked(next.picked);
    setDescription(next.description);
    setBags(next.bags);
    setKg(next.kg);
    setFormError(null);
  };
  // Reset only when a result is (re)loaded, not on every pool change.
  const loadKey = `${view?.shift_id}|${savedAt}`;
  const [lastLoadKey, setLastLoadKey] = useState<string | null>(null);
  if (loadKey !== lastLoadKey) {
    setLastLoadKey(loadKey);
    resetForm();
  }

  const setDraft = (id: string, patch: Partial<ReportDraft>) =>
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { status: 'none', before: [], after: [] }), ...patch },
    }));

  /** Adds uploaded photos (with their checks) to one side of a waste point; `fallback` is its draft as rendered. */
  const addPhotos = (
    id: string,
    side: ResultPhotoSide,
    fallback: ReportDraft,
    items: Array<{ url: string; check: IResultPhotoCheck }>,
  ) => {
    setChecks((prev) => {
      const next = { ...prev };
      for (const i of items) next[i.url] = i.check;
      return next;
    });
    setDrafts((prev) => {
      const cur = prev[id] ?? fallback;
      return {
        ...prev,
        [id]: {
          ...cur,
          [side]: [...cur[side], ...items.map((i) => i.url)].slice(0, MAX_PHOTOS_PER_SIDE),
        },
      };
    });
  };

  /** The save request, or null after showing what is missing. */
  const toPayload = (params: { campaign_id: string; shift_id: string }): SaveShiftResultParams | null => {
    if (!view) return null;
    const res = buildSavePayload(params, view.report_ids, view.media, { drafts, picked, description, bags, kg });
    if ('error' in res) {
      setFormError(t(res.error));
      return null;
    }
    setFormError(null);
    return res.payload;
  };

  return {
    drafts,
    checks,
    picked,
    setPicked,
    description,
    setDescription,
    bags,
    setBags,
    kg,
    setKg,
    formError,
    resetForm,
    setDraft,
    addPhotos,
    toPayload,
  };
}
