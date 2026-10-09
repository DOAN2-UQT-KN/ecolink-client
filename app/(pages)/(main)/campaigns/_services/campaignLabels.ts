import { format } from 'date-fns';

import type { ICampaign } from '@/apis/campaign/models/campaign';

type T = (key: string, options?: Record<string, unknown>) => string;

/** A meeting point's name, or "Meeting point N" when it has none. */
export const meetingPointName = (point: { name?: string | null } | undefined, index: number, t: T) =>
  point?.name?.trim() || t('Meeting point {{n}}', { n: index + 1 });

/** "HH:mm" of an ISO time, or `fallback` when there is none. */
export const hhmm = (iso: string | null | undefined, fallback = '') =>
  iso ? format(new Date(iso), 'HH:mm') : fallback;

/** "Day N · Monday, Jan 1, 2026". */
export const dayLabel = (day: { start_at: string }, index: number, t: T) =>
  `${t('Day {{n}}', { n: index + 1 })} · ${format(new Date(day.start_at), 'EEEE, PP')}`;

/** "Meeting point · dd/MM HH:mm" of a shift, or '' when the shift is unknown. */
export const shiftLabel = (campaign: ICampaign | undefined, shiftId: string, t: T) => {
  const shift = campaign?.shifts?.find((s) => s.id === shiftId);
  if (!shift) return '';
  const points = campaign?.meeting_points ?? [];
  const index = points.findIndex((p) => p.id === shift.meeting_point_id);
  const point = index < 0 ? '' : meetingPointName(points[index], index, t);
  return `${point} · ${format(new Date(shift.start_at), 'dd/MM HH:mm')}`;
};
