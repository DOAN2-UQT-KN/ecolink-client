import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';
import { useGet, UseGetOptions, usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type { IOrganizationOwner } from '@/apis/organization/models/organization';
import type { ShiftStatus } from '@/apis/campaign/models/lifecycle';

const base = '/api/v1/campaigns';

/** Shift results and status (spec 4.2). */

export type ShiftResultReportStatus = 'cleaned' | 'partial';

/** Result verification, Layer 1: each check and photo is graded pass / warn / fail. */
export type ResultCheckLevel = 'pass' | 'warn' | 'fail';
export type ResultPhotoSide = 'before' | 'after';

/** The checks of one trash point photo, made when it was uploaded through `result-photos`. */
export interface IResultPhotoCheck {
  id: string;
  url: string;
  side: ResultPhotoSide;
  level: ResultCheckLevel;
  /** Taken at most 48 h before the upload (warn: no capture time). */
  time_check: ResultCheckLevel;
  /** The photo's GPS within 100 m of the pin (warn: no GPS in the photo). */
  exif_location_check: ResultCheckLevel;
  /** The pin within 100 m of the trash point (warn: the point has no location). */
  pin_check: ResultCheckLevel;
  exif_taken_at: string | null;
  exif_lat: number | null;
  exif_lng: number | null;
  camera_model: string | null;
  pin_lat: number;
  pin_lng: number;
  pin_distance_m: number | null;
  exif_distance_m: number | null;
  uploaded_at: string;
}

export type Layer1IssueCode =
  | 'photo_fail'
  | 'photo_warn'
  | 'legacy_photo'
  | 'before_not_earlier'
  | 'before_after_same'
  | 'hash_reused';

export interface ILayer1Issue {
  code: Layer1IssueCode;
  side?: ResultPhotoSide;
  url?: string;
}

/** Layer 1 of a trash point: the worst of its photos and of the checks on the pair. */
export interface ILayer1 {
  level: ResultCheckLevel;
  issues: ILayer1Issue[];
  /** `check` null: saved before photos were checked. */
  photos: Array<{ url: string; side: ResultPhotoSide; check: IResultPhotoCheck | null }>;
}

export interface IShiftResultReport {
  report_id: string;
  status: ShiftResultReportStatus;
  before_urls: string[];
  after_urls: string[];
  /** Response only. */
  layer1?: ILayer1 | null;
}

export interface IShiftMedia {
  id: string;
  url: string;
  kind: 'image' | 'video';
  uploaded_by: string;
  uploader: IOrganizationOwner | null;
  included_in_result: boolean;
  created_at: string;
}

export interface IShiftResult {
  description: string;
  waste_bags: number | null;
  waste_kg: number | null;
  submitted_by: string;
  submitted_at: string;
  updated_at: string;
  reports: IShiftResultReport[];
}

export interface IShiftResultView {
  shift_id: string;
  status: ShiftStatus;
  start_at: string;
  end_at: string;
  ended_at: string | null;
  leader_user_id: string | null;
  /** Leader or campaign manager: submits the result, ends the shift early. */
  can_edit: boolean;
  /** Managers, admins, the leader and volunteers who attended: the whole photo pool. Anyone else gets the submitted result and only the photos chosen for it (public campaign). */
  can_view: boolean;
  /** May add photos to the shift's pool. */
  can_contribute: boolean;
  /** The campaign was marked done: nothing changes any more. */
  locked: boolean;
  /** The admin asked for more on this shift (spec 5.2); cleared once the result is saved again. */
  reopened_at: string | null;
  reopen_reason: string | null;
  report_ids: string[];
  result: IShiftResult | null;
  media: IShiftMedia[];
}

export interface IShiftOverviewRow {
  shift_id: string;
  day_id: string;
  meeting_point_id: string;
  start_at: string;
  end_at: string;
  ended_at: string | null;
  status: ShiftStatus;
  registered: number;
  present: number;
  eligible: number;
  has_result: boolean;
  reopened_at: string | null;
  reopen_reason: string | null;
  waste_bags: number | null;
  waste_kg: number | null;
}

export interface IShiftOverview {
  shifts: IShiftOverviewRow[];
  totals: {
    active_shifts: number;
    ended_shifts: number;
    /** Shifts that are on but not ended: they block "Mark done". */
    not_ended_shift_ids: string[];
    registered: number;
    present: number;
    present_rate: number | null;
    waste_bags: number;
    waste_kg: number;
    reports: { cleaned: number; partial: number; untouched: number };
  };
}

type ShiftParams = { campaign_id: string; shift_id: string };
const shiftUrl = ({ campaign_id, shift_id }: ShiftParams) => `${base}/${campaign_id}/shifts/${shift_id}`;

export const useShiftResult = (
  params: ShiftParams,
  options?: Omit<UseGetOptions<IBaseResponse<IShiftResultView>>, 'queryKey' | 'queryFn'>,
) =>
  useGet({
    queryKey: ['shift-result', params.shift_id],
    queryFn: () => requestApi.get<IBaseResponse<IShiftResultView>>(`${shiftUrl(params)}/result`),
    ...options,
  });

export type SaveShiftResultParams = ShiftParams & {
  description: string;
  waste_bags?: number | null;
  waste_kg?: number | null;
  reports: IShiftResultReport[];
  media_ids: string[];
};

export const useSaveShiftResult = (
  options?: UsePostOptions<IBaseResponse<IShiftResultView>, SaveShiftResultParams>,
) =>
  usePost({
    mutationFn: ({ campaign_id, shift_id, ...body }: SaveShiftResultParams) =>
      requestApi.put<IBaseResponse<IShiftResultView>>(`${shiftUrl({ campaign_id, shift_id })}/result`, body),
    queryKey: ['shift-result'],
    messageError: { type: MessageType.Toast },
    ...options,
  });

export type UploadResultPhotoParams = ShiftParams & {
  file: File;
  report_id: string;
  side: ResultPhotoSide;
  pin_lat: number;
  pin_lng: number;
};

/**
 * Uploads the original file of a trash point photo (no compression: the server reads its EXIF and
 * hash), with where the uploader pinned it. The PUT of the result accepts only URLs from here.
 */
export const uploadResultPhoto = ({ campaign_id, shift_id, file, ...fields }: UploadResultPhotoParams) => {
  const form = new FormData();
  form.append('report_id', fields.report_id);
  form.append('side', fields.side);
  form.append('pin_lat', String(fields.pin_lat));
  form.append('pin_lng', String(fields.pin_lng));
  form.append('file', file);
  return requestApi.post<IBaseResponse<{ url: string; check: IResultPhotoCheck }>>(
    `${shiftUrl({ campaign_id, shift_id })}/result-photos`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
};

export const useUploadResultPhoto = (
  options?: UsePostOptions<IBaseResponse<{ url: string; check: IResultPhotoCheck }>, UploadResultPhotoParams>,
) =>
  usePost({
    mutationFn: uploadResultPhoto,
    messageError: { type: MessageType.Toast },
    ...options,
  });

/** Ends a running shift now; it needs a result first. */
export const useEndShiftEarly = (
  options?: UsePostOptions<IBaseResponse<{ ended_at: string; checked_out: number }>, ShiftParams>,
) =>
  usePost({
    mutationFn: (params: ShiftParams) =>
      requestApi.post<IBaseResponse<{ ended_at: string; checked_out: number }>>(`${shiftUrl(params)}/end`, {}),
    queryKey: ['shift-result'],
    messageError: { type: MessageType.Toast },
    ...options,
  });

export type AddShiftMediaParams = ShiftParams & { url: string; kind: 'image' | 'video' };

export const useAddShiftMedia = (
  options?: UsePostOptions<IBaseResponse<{ media: IShiftMedia }>, AddShiftMediaParams>,
) =>
  usePost({
    mutationFn: ({ campaign_id, shift_id, ...body }: AddShiftMediaParams) =>
      requestApi.post<IBaseResponse<{ media: IShiftMedia }>>(`${shiftUrl({ campaign_id, shift_id })}/media`, body),
    queryKey: ['shift-result'],
    messageError: { type: MessageType.Toast },
    ...options,
  });

export const useRemoveShiftMedia = (
  options?: UsePostOptions<IBaseResponse<unknown>, ShiftParams & { media_id: string }>,
) =>
  usePost({
    mutationFn: ({ media_id, ...params }: ShiftParams & { media_id: string }) =>
      requestApi.delete<IBaseResponse<unknown>>(`${shiftUrl(params)}/media/${media_id}`),
    queryKey: ['shift-result'],
    messageError: { type: MessageType.Toast },
    ...options,
  });

/** Every shift's status and figures, with the campaign totals (managers and admins). */
export const useShiftOverview = (
  campaignId: string,
  options?: Omit<UseGetOptions<IBaseResponse<IShiftOverview>>, 'queryKey' | 'queryFn'>,
) =>
  useGet({
    queryKey: ['shift-overview', campaignId],
    queryFn: () => requestApi.get<IBaseResponse<IShiftOverview>>(`${base}/${campaignId}/shift-overview`),
    ...options,
  });
