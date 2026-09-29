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
  /** "HH:mm" on the campaign day. */
  gather_time: string;
  slots?: number | null;
  leader_user_id: string;
  reports: IIncident[];
}

export interface CampaignFormValues {
  organization_id: string;
  title: string;
  description: string;
  banner?: string | File | Blob;
  difficulty: number;
  /** "YYYY-MM-DD" (local); campaigns last one day for now. */
  campaign_date?: string;
  /** "HH:mm" */
  start_time: string;
  end_time: string;
  contact_name: string;
  contact_phone: string;
  safety_notes: string;
  min_age?: number | null;
  /** Comma-separated, e.g. "Swimming, First aid". */
  skills: string;
  bring_own_tools: boolean;
  meeting_points: MeetingPointFormValues[];
}

export const emptyMeetingPoint = (leaderUserId = ""): MeetingPointFormValues => ({
  name: "",
  latitude: undefined,
  longitude: undefined,
  detail_address: "",
  radius_km: DEFAULT_MEETING_POINT_RADIUS_KM,
  gather_time: "",
  slots: null,
  leader_user_id: leaderUserId,
  reports: [],
});

export const DEFAULT_CAMPAIGN_FORM_VALUES: CampaignFormValues = {
  organization_id: "",
  title: "",
  description: "",
  banner: undefined,
  difficulty: DIFFICULTY_MIN,
  campaign_date: undefined,
  start_time: "07:00",
  end_time: "11:00",
  contact_name: "",
  contact_phone: "",
  safety_notes: "",
  min_age: null,
  skills: "",
  bring_own_tools: false,
  meeting_points: [emptyMeetingPoint()],
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
    start_date: combineDateTime(data.campaign_date, data.start_time),
    end_date: combineDateTime(data.campaign_date, data.end_time),
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
    // A meeting point needs a location; half-filled ones are dropped from the draft.
    meeting_points: data.meeting_points
      .filter((p) => p.latitude != null && p.longitude != null)
      .map((p) => ({
        name: optionalText(p.name),
        latitude: p.latitude as number,
        longitude: p.longitude as number,
        detail_address: truncateDetailAddress(p.detail_address) || null,
        radius_km: Number(p.radius_km) || DEFAULT_MEETING_POINT_RADIUS_KM,
        gather_at: combineDateTime(data.campaign_date, p.gather_time) ?? null,
        slots: p.slots ? Number(p.slots) : null,
        leader_user_id: p.leader_user_id || null,
        report_ids: p.reports.map((r) => r.id),
      })),
  };
};

/** An existing campaign (draft, under review, needs revision) → form values for editing. */
export const campaignToFormValues = (campaign: ICampaign): CampaignFormValues => {
  const start = campaign.start_date ? new Date(campaign.start_date) : undefined;
  const end = campaign.end_date ? new Date(campaign.end_date) : undefined;
  const reportsById = new Map((campaign.reports ?? []).map((r) => [r.id, r]));
  const points = campaign.meeting_points ?? [];
  const requirements = campaign.requirements ?? null;

  return {
    organization_id: campaign.organization_id ?? "",
    title: campaign.title ?? "",
    description: campaign.description ?? "",
    banner: campaign.banner ?? undefined,
    difficulty: clampDifficulty(campaign.difficulty),
    campaign_date: start ? toLocalDate(start) : undefined,
    start_time: start ? toLocalTime(start) : DEFAULT_CAMPAIGN_FORM_VALUES.start_time,
    end_time: end ? toLocalTime(end) : DEFAULT_CAMPAIGN_FORM_VALUES.end_time,
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
            gather_time: p.gather_at ? toLocalTime(new Date(p.gather_at)) : "",
            slots: p.slots ?? null,
            leader_user_id: p.leader_user_id ?? "",
            reports: p.report_ids
              .map((id) => reportsById.get(id))
              .filter((r): r is IIncident => Boolean(r)),
          }))
        : [emptyMeetingPoint(campaign.created_by ?? "")],
  };
};

/** Minimum age implied by the difficulty (volunteers must be adults on hard campaigns). */
export const impliedMinAge = (difficulty: number): number | null =>
  difficulty >= CAMPAIGN_HIGH_DIFFICULTY_LEVEL ? CAMPAIGN_HIGH_DIFFICULTY_MIN_AGE : null;

/**
 * Server field path (camelCase, e.g. `meetingPoints[1].slots`) → form field name.
 * Unknown paths return null and are shown in the summary only.
 */
export const issueFieldToFormName = (field: string): string | null => {
  const point = field.match(/^meetingPoints\[(\d+)\]\.?(\w+)?$/);
  if (point) {
    const [, index, key] = point;
    const map: Record<string, string> = {
      name: "name",
      radiusKm: "radius_km",
      slots: "slots",
      leaderUserId: "leader_user_id",
      gatherAt: "gather_time",
      reportIds: "reports",
    };
    return `meeting_points.${index}.${key ? (map[key] ?? "latitude") : "latitude"}`;
  }
  const top: Record<string, string> = {
    title: "title",
    description: "description",
    banner: "banner",
    startDate: "start_time",
    endDate: "end_time",
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
