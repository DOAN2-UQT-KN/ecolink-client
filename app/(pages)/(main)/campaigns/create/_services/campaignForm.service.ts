import { IIncident } from "@/apis/incident/models/incident";
import { DIFFICULTY_MIN } from "@/constants/difficulty";
import { CAMPAIGN_TITLE_MAX_LENGTH } from "@/constants/campaignLifecycle";

/** Form shape of the campaign wizard: values, empty rows and grid helpers (no payload mapping). */
export const TITLE_MAX_LENGTH = CAMPAIGN_TITLE_MAX_LENGTH;
export const DEFAULT_MEETING_POINT_RADIUS_KM = 1;

export interface MeetingPointFormValues {
  /** Existing meeting point (edit); none for a new one. Not `id`: useFieldArray owns that key. */
  server_id?: string;
  name: string;
  latitude?: number;
  longitude?: number;
  detail_address: string;
  radius_km: number;
  reports: IIncident[];
}

export interface CampaignDayFormValues {
  /** Existing day (edit); none for a new one. Its times are fixed once approved (3.5). */
  server_id?: string;
  /** "YYYY-MM-DD" (local). */
  date?: string;
  /** "HH:mm" */
  start_time: string;
  end_time: string;
}

/** One cell of the day × meeting point grid. */
export interface ShiftFormValues {
  /** Volunteers needed; null = not filled in yet, 0 = the shift is off. */
  min_volunteers: number | null;
  /** Expected maximum; optional. */
  max_volunteers: number | null;
  /** "HH:mm" on that day; "" = the day's start / end. */
  start_time: string;
  end_time: string;
  /** "HH:mm" on that day. */
  gather_time: string;
  leader_user_id: string;
  /** Minimum saved on the server; a running shift of an approved campaign keeps ≥ 1. */
  saved_min?: number;
}

export interface CampaignFormValues {
  organization_id: string;
  title: string;
  description: string;
  banner?: string | File | Blob;
  difficulty: number;
  days: CampaignDayFormValues[];
  contact_name: string;
  contact_phone: string;
  safety_notes: string;
  min_age?: number | null;
  /** Comma-separated, e.g. "Swimming, First aid". */
  skills: string;
  bring_own_tools: boolean;
  meeting_points: MeetingPointFormValues[];
  /** `schedule[day][meetingPoint]`, always days.length × meeting_points.length. */
  schedule: ShiftFormValues[][];
  /** Required when a day's minimum is below the difficulty's suggestion. */
  min_volunteers_reason: string;
}

export const emptyMeetingPoint = (): MeetingPointFormValues => ({
  name: "",
  latitude: undefined,
  longitude: undefined,
  detail_address: "",
  radius_km: DEFAULT_MEETING_POINT_RADIUS_KM,
  reports: [],
});

export const emptyDay = (): CampaignDayFormValues => ({
  date: undefined,
  start_time: "07:00",
  end_time: "11:00",
});

export const emptyShift = (leaderUserId = ""): ShiftFormValues => ({
  min_volunteers: null,
  max_volunteers: null,
  start_time: "",
  end_time: "",
  gather_time: "",
  leader_user_id: leaderUserId,
});

/** Pads or trims the grid to `dayCount` × `pointCount`, keeping the cells that exist. */
export const fitSchedule = (
  schedule: ShiftFormValues[][] | undefined,
  dayCount: number,
  pointCount: number,
  leaderUserId: string,
): ShiftFormValues[][] =>
  Array.from({ length: dayCount }, (_, d) =>
    Array.from(
      { length: pointCount },
      (_, p) => schedule?.[d]?.[p] ?? emptyShift(leaderUserId),
    ),
  );

export const DEFAULT_CAMPAIGN_FORM_VALUES: CampaignFormValues = {
  organization_id: "",
  title: "",
  description: "",
  banner: undefined,
  difficulty: DIFFICULTY_MIN,
  days: [emptyDay()],
  contact_name: "",
  contact_phone: "",
  safety_notes: "",
  min_age: null,
  skills: "",
  bring_own_tools: false,
  meeting_points: [emptyMeetingPoint()],
  schedule: [[emptyShift()]],
  min_volunteers_reason: "",
};

/** The grid without day `dayIndex`. */
export const dropScheduleRow = (grid: ShiftFormValues[][] | undefined, dayIndex: number) => {
  const next = [...(grid ?? [])];
  next.splice(dayIndex, 1);
  return next;
};

/** The grid without meeting point `pointIndex`. */
export const dropScheduleColumn = (grid: ShiftFormValues[][] | undefined, pointIndex: number) =>
  (grid ?? []).map((row) => {
    const next = [...row];
    next.splice(pointIndex, 1);
    return next;
  });
