import type {
  IMeetingPointView,
  IVerificationTrashPoint,
  MeetingPointCannotVote,
  MeetingPointDecisionCode,
  MeetingPointVoteValue,
} from '@/apis/campaign/models/verification';
import type { GeoPoint } from '@/libs/geo';

export const NOTE_MAX = 1000;

/** English sentences; translate with `t()`. */
export const CANNOT_VOTE_LABEL: Record<MeetingPointCannotVote, string> = {
  closed: 'Voting on this meeting point is closed.',
  org_member: 'Members of the organization running the campaign cannot vote.',
  campaign_manager: "The campaign's managers cannot vote.",
  volunteer: 'Volunteers who attended the campaign cannot vote.',
};

export const DECISION_LABEL: Record<MeetingPointDecisionCode, string> = {
  score: 'Enough confirmations',
  layer1_pass: 'No objection and the photos passed the check',
  layer1_fail: 'The photos failed the automatic check',
  flag_timeout: 'The admin did not decide in time',
  admin: 'Decided by the admin',
};

/** Waste points ticked when the "not clean" form opens: the saved vote's, or the only cleaned one. */
export function initialFlagged(point: IMeetingPointView, cleaned: IVerificationTrashPoint[]): string[] {
  return point.my_vote?.flagged_report_ids.length
    ? point.my_vote.flagged_report_ids
    : cleaned.length === 1
      ? [cleaned[0].report_id]
      : [];
}

/** The i18n key of what a "not clean" vote is missing, or null. */
export function downVoteError(flagged: string[], note: string, photoUrl: string | null): string | null {
  if (flagged.length === 0) return 'Pick at least one waste point that is not clean.';
  if (!note.trim() && !photoUrl) return 'Add a note or a photo to say what is not clean.';
  return null;
}

export function buildVotePayload(
  campaignId: string,
  meetingPointId: string,
  value: MeetingPointVoteValue,
  down: { flagged: string[]; note: string; photoUrl: string | null },
  pos: GeoPoint | null,
) {
  return {
    campaign_id: campaignId,
    meeting_point_id: meetingPointId,
    value,
    ...(value === 'down'
      ? {
          report_ids: down.flagged,
          ...(down.note.trim() ? { note: down.note.trim() } : {}),
          ...(down.photoUrl ? { photo_url: down.photoUrl } : {}),
        }
      : {}),
    ...(pos
      ? { latitude: pos.lat, longitude: pos.lng, accuracy: pos.accuracy }
      : {}),
  };
}

/** The meeting point a notification pointed at: by id, or the one holding the waste point. */
export function findFocusPoint(
  pointId: string | null,
  reportId: string | null,
  meetingPoints: IMeetingPointView[] | undefined,
): string | null {
  if (pointId) return pointId;
  if (!reportId || !meetingPoints) return null;
  return (
    meetingPoints.find((mp) => mp.trash_points.some((tp) => tp.report_id === reportId))?.meeting_point_id ?? null
  );
}

/** Where to show the meeting point: its own position, else the first waste point that has one. */
export function meetingPointCoords(point: IMeetingPointView) {
  const firstWithCoords = point.trash_points.find((tp) => tp.report?.latitude != null && tp.report?.longitude != null);
  return {
    lat: point.latitude ?? firstWithCoords?.report?.latitude ?? null,
    lng: point.longitude ?? firstWithCoords?.report?.longitude ?? null,
  };
}

/** Whole hours and minutes left until `iso` (never negative). */
export function remainingParts(iso: string, now: number) {
  const minutes = Math.max(0, Math.round((new Date(iso).getTime() - now) / 60_000));
  return { h: Math.floor(minutes / 60), m: minutes % 60 };
}
