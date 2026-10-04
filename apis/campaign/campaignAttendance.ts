import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';
import { useGet, UseGetOptions, usePost, UsePostOptions } from '@/hooks/reactQuery';
import { MessageType } from '@/utils/showMessage';
import type { IOrganizationOwner } from '@/apis/organization/models/organization';

const base = '/api/v1/campaigns';

/** Attendance per shift (spec 4.1): QR sessions, dynamic codes, GPS-checked scans. */

export interface IAttendanceSession {
  id: string;
  opened_by: string;
  expires_at: string;
}

export interface IAttendanceQr {
  token: string;
  period_sec: number;
  session_id: string;
  session_expires_at: string;
}

export interface IShiftAttendanceRow {
  user_id: string;
  volunteer: IOrganizationOwner;
  check_in_at: string;
  check_out_at: string | null;
  check_out_method: 'scan' | 'session_close' | null;
  manual: boolean;
  manual_reason: string | null;
  pre_registered: boolean;
  offline: boolean;
  /** A scan was farther than 50 m from the meeting point: recorded, for a manager to check. */
  out_of_area: boolean;
  /** A scan's GPS accuracy was worse than 50 m. */
  low_accuracy: boolean;
  check_in_distance_m: number | null;
  check_out_distance_m: number | null;
  /** Taken out of the points by a leader or manager. */
  excluded: boolean;
  exclude_reason: string | null;
  presence_minutes: number;
  eligible: boolean;
}

export interface IShiftAttendanceView {
  shift_id: string;
  start_at: string;
  end_at: string;
  /** Actual end when the shift was ended early (spec 4.2). */
  ended_at?: string | null;
  leader_user_id: string | null;
  session: IAttendanceSession | null;
  can_run: boolean;
  present: number;
  manual: number;
  eligible: number;
  flagged: number;
  attendances: IShiftAttendanceRow[];
}

export type ScanAction = 'check_in' | 'check_out' | 'already_checked_in' | 'already_checked_out';

export interface IScanResult {
  action: ScanAction;
  shift_id: string;
  check_in_at: string;
  check_out_at: string | null;
  eligible: boolean;
  flags: { out_of_area: boolean; low_accuracy: boolean; distance_m: number };
}

type ShiftParams = { campaign_id: string; shift_id: string };
const shiftUrl = ({ campaign_id, shift_id }: ShiftParams) =>
  `${base}/${campaign_id}/shifts/${shift_id}/attendance`;

export const useShiftAttendance = (
  params: ShiftParams,
  options?: Omit<UseGetOptions<IBaseResponse<IShiftAttendanceView>>, 'queryKey' | 'queryFn'>,
) =>
  useGet({
    queryKey: ['shift-attendance', params.shift_id],
    queryFn: () => requestApi.get<IBaseResponse<IShiftAttendanceView>>(shiftUrl(params)),
    ...options,
  });

/** The open session's current code; refetch every `period_sec`. */
export const useAttendanceQr = (
  params: ShiftParams,
  options?: Omit<UseGetOptions<IBaseResponse<IAttendanceQr>>, 'queryKey' | 'queryFn'>,
) =>
  useGet({
    queryKey: ['shift-attendance-qr', params.shift_id],
    queryFn: () => requestApi.get<IBaseResponse<IAttendanceQr>>(`${shiftUrl(params)}/qr`),
    ...options,
  });

export const useOpenAttendanceSession = (
  options?: UsePostOptions<IBaseResponse<{ session: IAttendanceSession }>, ShiftParams>,
) =>
  usePost({
    mutationFn: (params: ShiftParams) =>
      requestApi.post<IBaseResponse<{ session: IAttendanceSession }>>(`${shiftUrl(params)}/session`, {}),
    queryKey: ['shift-attendance'],
    messageError: { type: MessageType.Toast },
    ...options,
  });

export const useCloseAttendance = (
  options?: UsePostOptions<IBaseResponse<{ checked_out: number }>, ShiftParams>,
) =>
  usePost({
    mutationFn: (params: ShiftParams) =>
      requestApi.post<IBaseResponse<{ checked_out: number }>>(`${shiftUrl(params)}/close`, {}),
    queryKey: ['shift-attendance'],
    messageError: { type: MessageType.Toast },
    ...options,
  });

export type AddManualAttendanceParams = ShiftParams & {
  user_id: string;
  reason: string;
  check_in_at?: string;
};

export const useAddManualAttendance = (
  options?: UsePostOptions<IBaseResponse<unknown>, AddManualAttendanceParams>,
) =>
  usePost({
    mutationFn: ({ campaign_id, shift_id, ...body }: AddManualAttendanceParams) =>
      requestApi.post<IBaseResponse<unknown>>(`${shiftUrl({ campaign_id, shift_id })}/manual`, body),
    queryKey: ['shift-attendance'],
    messageError: { type: MessageType.Toast },
    ...options,
  });

export type ExcludeAttendanceParams = ShiftParams & { user_id: string; reason: string };

/** Take an attendance out of the points (e.g. a flagged scan), with a reason. */
export const useExcludeAttendance = (
  options?: UsePostOptions<IBaseResponse<unknown>, ExcludeAttendanceParams>,
) =>
  usePost({
    mutationFn: ({ campaign_id, shift_id, user_id, reason }: ExcludeAttendanceParams) =>
      requestApi.post<IBaseResponse<unknown>>(
        `${shiftUrl({ campaign_id, shift_id })}/${user_id}/exclude`,
        { reason },
      ),
    queryKey: ['shift-attendance'],
    messageError: { type: MessageType.Toast },
    ...options,
  });

/** Put an excluded attendance back into the points. */
export const useRestoreAttendance = (
  options?: UsePostOptions<IBaseResponse<unknown>, ShiftParams & { user_id: string }>,
) =>
  usePost({
    mutationFn: ({ campaign_id, shift_id, user_id }: ShiftParams & { user_id: string }) =>
      requestApi.post<IBaseResponse<unknown>>(`${shiftUrl({ campaign_id, shift_id })}/${user_id}/restore`, {}),
    queryKey: ['shift-attendance'],
    messageError: { type: MessageType.Toast },
    ...options,
  });

/** Check in or out with a scanned code and the device's position. */
export const scanAttendance = (
  campaignId: string,
  body: { token: string; latitude: number; longitude: number; accuracy: number },
): Promise<IBaseResponse<IScanResult>> =>
  requestApi.post<IBaseResponse<IScanResult>>(`${base}/${campaignId}/attendance/scan`, body);
