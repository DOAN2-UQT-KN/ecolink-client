import type {
  CampaignDayFormValues,
  CampaignFormValues,
  ShiftFormValues,
} from './campaign.service';

/** "HH:mm" → minutes since midnight, or null when not a time. */
export const minutesOf = (time?: string): number | null => {
  const m = time?.match(/^(\d{2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
export const timeOf = (minutes: number): string => {
  const clamped = Math.min(Math.max(minutes, 0), 23 * 60 + 59);
  return `${`${Math.floor(clamped / 60)}`.padStart(2, '0')}:${`${clamped % 60}`.padStart(2, '0')}`;
};

/** Sum of the minimum volunteers of one day's shifts. */
export const dayMinTotal = (row: ShiftFormValues[] | undefined): number =>
  (row ?? []).reduce((sum, c) => sum + (Number(c?.min_volunteers) || 0), 0);

const isBelow = (total: number, suggested: number) => total > 0 && total < suggested;

/** "07:00 – 11:00" for a day. */
export const dayHours = (day?: CampaignDayFormValues) =>
  `${day?.start_time || '—'} – ${day?.end_time || '—'}`;

/** Day 1's volunteer numbers, leaders and time offsets, copied to the other days. */
export const copyFirstDayToAll = (values: CampaignFormValues): ShiftFormValues[][] => {
  const first = values.schedule[0] ?? [];
  const firstStart = minutesOf(values.days[0]?.start_time);
  return values.schedule.map((row, d) => {
    if (d === 0) return row;
    const start = minutesOf(values.days[d]?.start_time);
    // Same distance from the day's start; "" (the day's hours) stays "".
    const shifted = (time: string) => {
      const m = minutesOf(time);
      return m != null && firstStart != null && start != null
        ? timeOf(start + (m - firstStart))
        : time;
    };
    return row.map((_, p) => {
      const source = first[p];
      if (!source) return row[p];
      return {
        min_volunteers: source.min_volunteers,
        max_volunteers: source.max_volunteers,
        leader_user_id: source.leader_user_id,
        start_time: shifted(source.start_time),
        end_time: shifted(source.end_time),
        gather_time: shifted(source.gather_time),
      };
    });
  });
};

/** Indexes of the days whose total minimum is under what the difficulty suggests. */
export const daysBelowSuggestion = (
  dayCount: number,
  schedule: ShiftFormValues[][],
  suggestedMinPerDay: number | null,
): number[] =>
  suggestedMinPerDay == null
    ? []
    : Array.from({ length: dayCount }, (_, d) => d).filter((d) =>
        isBelow(dayMinTotal(schedule[d]), suggestedMinPerDay),
      );

// Validators: true when valid, otherwise the i18n key of the message.
type Result = true | string;

export const validateMinVolunteers = (
  v: number | null,
  values: CampaignFormValues,
  d: number,
  p: number,
  approvedEdit: boolean,
): Result => {
  if (v == null || Number.isNaN(v)) {
    return 'Enter the minimum volunteers (0 turns the shift off)';
  }
  if (!Number.isInteger(v) || v < 0) {
    return 'Minimum volunteers must be a whole number, 0 to turn the shift off';
  }
  // A running shift of an approved campaign is turned off from its page (spec 3.2).
  if (approvedEdit && v === 0 && (values.schedule[d]?.[p]?.saved_min ?? 0) > 0) {
    return 'A running shift needs at least 1 volunteer; turn it off from the shift page';
  }
  // Checks on the whole day live on its first shift.
  if (p !== 0) return true;
  const cells = values.schedule[d] ?? [];
  const total = dayMinTotal(cells);
  const allFilled = cells.every((c) => c?.min_volunteers != null);
  if (allFilled && total === 0) return 'Each day needs at least one shift that runs';
  return true;
};

export const validateMaxVolunteers = (
  v: number | null,
  values: CampaignFormValues,
  d: number,
  p: number,
): Result => {
  if (v == null || Number.isNaN(v)) return true;
  const min = Number(values.schedule[d]?.[p]?.min_volunteers) || 0;
  if (min === 0) return true;
  return Number.isInteger(v) && v >= min
    ? true
    : 'The expected maximum must be a whole number no lower than the minimum';
};

export const validateGatherTime = (
  v: string,
  values: CampaignFormValues,
  d: number,
  p: number,
): Result => {
  if (!v || !(Number(values.schedule[d]?.[p]?.min_volunteers) > 0)) return true;
  const cell = values.schedule[d]?.[p];
  // Gathering may be after the shift starts, but not once it is over.
  const end = minutesOf(cell?.end_time || values.days[d]?.end_time);
  const gather = minutesOf(v);
  return end == null || gather == null || gather < end
    ? true
    : 'Gathering time must be before the shift ends';
};

/** A shift's window sits inside its day; checked on the start field. */
export const validateShiftWindow = (values: CampaignFormValues, d: number, p: number): Result => {
  const cell = values.schedule[d]?.[p];
  if (!(Number(cell?.min_volunteers) > 0)) return true;
  const day = values.days[d];
  const dayStart = minutesOf(day?.start_time);
  const dayEnd = minutesOf(day?.end_time);
  const start = minutesOf(cell?.start_time || day?.start_time);
  const end = minutesOf(cell?.end_time || day?.end_time);
  if (dayStart == null || dayEnd == null || start == null || end == null) return true;
  return start < end && start >= dayStart && end <= dayEnd
    ? true
    : "A shift must start before it ends, within the day's hours";
};

export const validateLeader = (
  v: string,
  values: CampaignFormValues,
  d: number,
  p: number,
): Result =>
  !(Number(values.schedule[d]?.[p]?.min_volunteers) > 0) ||
  Boolean(v) ||
  'Choose who is in charge of this shift';

/** A day below the difficulty's suggestion needs a reason. */
export const validateMinVolunteersReason = (
  v: string,
  values: CampaignFormValues,
  suggestedMinPerDay: number | null,
): Result => {
  const low =
    suggestedMinPerDay != null &&
    values.schedule.some((row) => isBelow(dayMinTotal(row), suggestedMinPerDay));
  return !low || Boolean(v?.trim()) || 'Explain why a day needs fewer volunteers than suggested for this difficulty';
};
