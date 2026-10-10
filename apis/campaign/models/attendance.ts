import type { IOrganizationOwner } from '@/apis/organization/models/organization';
import type { ShiftParams } from './lifecycle';

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

export type AddManualAttendanceParams = ShiftParams & {
  user_id: string;
  reason: string;
  check_in_at?: string;
};

export type ExcludeAttendanceParams = ShiftParams & { user_id: string; reason: string };
