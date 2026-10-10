/** Tones and English labels (translate with `t()`) for campaign result verification. */
import type { ShiftStatus } from '@/apis/campaign/models/lifecycle';
import type { ResultCheckLevel, ShiftResultReportStatus } from '@/apis/campaign/models/shiftResult';
import type {
  MeetingPointStatus,
  MeetingPointWeightReason,
  VerificationTrashPointStatus,
} from '@/apis/campaign/models/verification';
import type { PillTone } from '@/components/ui/Pill';

export const SHIFT_STATUS_TONE: Record<ShiftStatus, PillTone> = {
  upcoming: 'blue',
  running: 'cyan',
  awaiting_result: 'amber',
  ended: 'green',
  off: 'neutral',
};

/** English label of a shift status; translate with `t()`. */
export const SHIFT_STATUS_LABEL: Record<ShiftStatus, string> = {
  upcoming: 'Not started',
  running: 'Running',
  awaiting_result: 'Awaiting result',
  ended: 'Ended',
  off: 'Turned off',
};

export const CHECK_LEVEL_TONE: Record<ResultCheckLevel, PillTone> = { pass: 'green', warn: 'amber', fail: 'red' };
/** English labels; translate with `t()`. */
export const CHECK_LEVEL_LABEL: Record<ResultCheckLevel, string> = {
  pass: 'Pass',
  warn: 'Warning',
  fail: 'Fail',
};

export const MEETING_POINT_STATUS_TONE: Record<MeetingPointStatus, PillTone> = {
  voting: 'blue',
  verified: 'green',
  flagged: 'orange',
  rejected: 'red',
};
export const MEETING_POINT_STATUS_LABEL: Record<MeetingPointStatus, string> = {
  voting: 'Voting',
  verified: 'Verified',
  flagged: 'Flagged',
  rejected: 'Not accepted',
};

/** How the submission declared a trash point. */
export const TRASH_POINT_RESULT_TONE: Record<VerificationTrashPointStatus, PillTone> = {
  cleaned: 'green',
  partial: 'amber',
  unhandled: 'red',
};
export const TRASH_POINT_RESULT_LABEL: Record<VerificationTrashPointStatus, string> = {
  cleaned: 'Cleaned',
  partial: 'Partly done',
  unhandled: 'Not handled',
};

/** Why a vote weighs what it does. */
export const WEIGHT_REASON_LABEL: Record<MeetingPointWeightReason, string> = {
  reporter: 'Reported a waste point here',
  on_site: 'On site (within 30 m)',
  nearby: 'Nearby (within 5 km)',
  zero_new_account: 'Account younger than 7 days, does not count',
  zero_unverified: 'Email not verified, does not count',
  zero_far: 'Too far away or no location, does not count',
};

export type ReportChoice = ShiftResultReportStatus | 'none';

export const REPORT_TONE = { cleaned: 'green', partial: 'amber', none: 'neutral' } as const;
export const REPORT_LABEL: Record<ReportChoice, string> = {
  cleaned: 'Cleaned',
  partial: 'Partly done',
  none: 'Not handled',
};
