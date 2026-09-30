import { IIncident } from "@/apis/incident/models/incident";
import { IResource } from "@/apis/saved-resource/models/getResource";
import { ICampaign } from "@/apis/campaign/models/campaign";
import { ICreateCampaignRequest } from "@/apis/campaign/models/createCampaign";
import type { ICampaignValidationIssue } from "@/apis/campaign/models/lifecycle";
import { DIFFICULTY_MIN, clampDifficulty } from "@/constants/difficulty";
import {
  CAMPAIGN_HIGH_DIFFICULTY_LEVEL,
  CAMPAIGN_HIGH_DIFFICULTY_MIN_AGE,
  CAMPAIGN_TITLE_MAX_LENGTH,
} from "@/constants/campaignLifecycle";

export const TITLE_MAX_LENGTH = CAMPAIGN_TITLE_MAX_LENGTH;
export const DETAIL_ADDRESS_MAX_LENGTH = 255;
export const DEFAULT_MEETING_POINT_RADIUS_KM = 1;

export interface MeetingPointFormValues {
  name: string;
  latitude?: number;
  longitude?: number;
  detail_address: string;
  radius_km: number;
  reports: IIncident[];
}

export interface CampaignDayFormValues {
  /** "YYYY-MM-DD" (local). */
  date?: string;
  /** "HH:mm" */
  start_time: string;
  end_time: string;
}

/** One cell of the day × meeting point grid. */
export interface ShiftFormValues {
  /** null = not filled in yet; 0 = the shift is off. */
  slots: number | null;
  /** "HH:mm" on that day. */
  gather_time: string;
  leader_user_id: string;
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
  slots: null,
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
};

export const truncateDetailAddress = (value?: string | null): string => {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length <= DETAIL_ADDRESS_MAX_LENGTH) {
    return trimmed;
  }
  return trimmed.slice(0, DETAIL_ADDRESS_MAX_LENGTH);
};

/** Local date + "HH:mm" → ISO string, or undefined while either is missing. */
export const combineDateTime = (date?: string, time?: string): string | undefined => {
  if (!date || !time) return undefined;
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const pad = (n: number) => `${n}`.padStart(2, "0");
const toLocalDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toLocalTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const optionalText = (value: string) => value.trim() || null;

/**
 * Days, meeting points and shifts for the API. Half-filled days (no date) and meeting points
 * (no location) are left out of the draft, and the grid follows: shifts are sent by the position
 * of what is kept. A cell without slots yet is not sent; the server saves it as off.
 */
const scheduleToApi = (
  data: CampaignFormValues,
): Pick<ICreateCampaignRequest, "days" | "meeting_points" | "shifts"> => {
  const days = data.days
    .map((day, index) => ({ day, index }))
    .filter(({ day }) => combineDateTime(day.date, day.start_time) && combineDateTime(day.date, day.end_time));
  const points = data.meeting_points
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => point.latitude != null && point.longitude != null);

  const shifts: NonNullable<ICreateCampaignRequest["shifts"]> = [];
  days.forEach(({ day, index: d }, dayIndex) =>
    points.forEach(({ index: p }, meetingPointIndex) => {
      const cell = data.schedule[d]?.[p];
      if (!cell || cell.slots == null || Number.isNaN(Number(cell.slots))) return;
      shifts.push({
        day_index: dayIndex,
        meeting_point_index: meetingPointIndex,
        gather_at: combineDateTime(day.date, cell.gather_time) ?? null,
        slots: Number(cell.slots),
        leader_user_id: cell.leader_user_id || null,
      });
    }),
  );

  return {
    days: days.map(({ day }) => ({
      start_at: combineDateTime(day.date, day.start_time) as string,
      end_at: combineDateTime(day.date, day.end_time) as string,
    })),
    meeting_points: points.map(({ point }) => ({
      name: optionalText(point.name),
      latitude: point.latitude as number,
      longitude: point.longitude as number,
      detail_address: truncateDetailAddress(point.detail_address) || null,
      radius_km: Number(point.radius_km) || DEFAULT_MEETING_POINT_RADIUS_KM,
      report_ids: point.reports.map((r) => r.id),
    })),
    shifts,
  };
};

export const transformToApiData = (data: CampaignFormValues): ICreateCampaignRequest => {
  const skills = data.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const hasRequirements =
    data.min_age != null || skills.length > 0 || data.bring_own_tools;

  return {
    organization_id: data.organization_id,
    title: data.title.trim().slice(0, TITLE_MAX_LENGTH),
    description: data.description.trim() || undefined,
    banner: typeof data.banner === "string" ? data.banner : undefined,
    difficulty: clampDifficulty(data.difficulty),
    ...scheduleToApi(data),
    contact_name: optionalText(data.contact_name),
    contact_phone: optionalText(data.contact_phone),
    safety_notes: optionalText(data.safety_notes),
    requirements: hasRequirements
      ? {
          min_age: data.min_age ?? null,
          skills,
          bring_own_tools: data.bring_own_tools,
        }
      : null,
  };
};

/** An existing campaign (draft, under review, needs revision) → form values for editing. */
export const campaignToFormValues = (campaign: ICampaign): CampaignFormValues => {
  const reportsById = new Map((campaign.reports ?? []).map((r) => [r.id, r]));
  const points = campaign.meeting_points ?? [];
  const days = [...(campaign.days ?? [])].sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
  );
  const shifts = campaign.shifts ?? [];
  const requirements = campaign.requirements ?? null;

  return {
    organization_id: campaign.organization_id ?? "",
    title: campaign.title ?? "",
    description: campaign.description ?? "",
    banner: campaign.banner ?? undefined,
    difficulty: clampDifficulty(campaign.difficulty),
    days:
      days.length > 0
        ? days.map((d) => ({
            date: toLocalDate(new Date(d.start_at)),
            start_time: toLocalTime(new Date(d.start_at)),
            end_time: toLocalTime(new Date(d.end_at)),
          }))
        : [emptyDay()],
    contact_name: campaign.contact_name ?? "",
    contact_phone: campaign.contact_phone ?? "",
    safety_notes: campaign.safety_notes ?? "",
    min_age: requirements?.min_age ?? null,
    skills: (requirements?.skills ?? []).join(", "),
    bring_own_tools: Boolean(requirements?.bring_own_tools),
    meeting_points:
      points.length > 0
        ? points.map((p) => ({
            name: p.name ?? "",
            latitude: p.latitude,
            longitude: p.longitude,
            detail_address: p.detail_address ?? "",
            radius_km: p.radius_km,
            reports: p.report_ids
              .map((id) => reportsById.get(id))
              .filter((r): r is IIncident => Boolean(r)),
          }))
        : [emptyMeetingPoint()],
    schedule: fitSchedule(
      (days.length > 0 ? days : [null]).map((day) =>
        (points.length > 0 ? points : [null]).map((point) => {
          const shift =
            day && point
              ? shifts.find((sh) => sh.day_id === day.id && sh.meeting_point_id === point.id)
              : undefined;
          return shift
            ? {
                slots: shift.slots,
                gather_time: shift.gather_at ? toLocalTime(new Date(shift.gather_at)) : "",
                leader_user_id: shift.leader_user_id ?? "",
              }
            : emptyShift(campaign.created_by ?? "");
        }),
      ),
      Math.max(days.length, 1),
      Math.max(points.length, 1),
      campaign.created_by ?? "",
    ),
  };
};

/** Minimum age implied by the difficulty (volunteers must be adults on hard campaigns). */
export const impliedMinAge = (difficulty: number): number | null =>
  difficulty >= CAMPAIGN_HIGH_DIFFICULTY_LEVEL ? CAMPAIGN_HIGH_DIFFICULTY_MIN_AGE : null;

/** Day-level codes that belong on the date picker rather than the time inputs. */
const DAY_DATE_CODES = ["START_TOO_SOON", "DAY_DUPLICATED", "DAY_SPAN_TOO_WIDE"];
/** Day-level codes about its shifts, shown on the grid row. */
const DAY_SHIFT_CODES = ["DAY_NO_ACTIVE_SHIFT", "DAY_SLOTS_OVER_LIMIT"];

/**
 * Server field path (camelCase, e.g. `schedule[1][0].slots`) → form field name.
 * Unknown paths return null and are shown in the summary only.
 */
export const issueFieldToFormName = (field: string, code?: string): string | null => {
  if (field === "meetingPoints") return "meeting_points";
  if (field === "days") return "days";

  const day = field.match(/^days\[(\d+)\]\.?(\w+)?$/);
  if (day) {
    const [, index, key] = day;
    if (code && DAY_SHIFT_CODES.includes(code)) return `schedule.${index}`;
    if (!key || (code && DAY_DATE_CODES.includes(code))) return `days.${index}.date`;
    return `days.${index}.${key === "endAt" ? "end_time" : "start_time"}`;
  }

  const shift = field.match(/^schedule\[(\d+)\]\[(\d+)\]\.(\w+)$/);
  if (shift) {
    const [, d, p, key] = shift;
    const map: Record<string, string> = {
      slots: "slots",
      leaderUserId: "leader_user_id",
      gatherAt: "gather_time",
    };
    return `schedule.${d}.${p}.${map[key] ?? "slots"}`;
  }

  const point = field.match(/^meetingPoints\[(\d+)\]\.?(\w+)?$/);
  if (point) {
    const [, index, key] = point;
    const map: Record<string, string> = {
      name: "name",
      radiusKm: "radius_km",
      reportIds: "reports",
    };
    return `meeting_points.${index}.${key ? (map[key] ?? "latitude") : "latitude"}`;
  }
  const top: Record<string, string> = {
    title: "title",
    description: "description",
    banner: "banner",
    contactName: "contact_name",
    contactPhone: "contact_phone",
    difficulty: "difficulty",
    "requirements.minAge": "min_age",
  };
  return top[field] ?? null;
};

export type { ICampaignValidationIssue };

export const mapResourceToIncident = (resource: IResource): IIncident | null => {
  const nestedIncident = resource.resource;
  if (nestedIncident?.id) {
    return nestedIncident;
  }

  return null;
};
