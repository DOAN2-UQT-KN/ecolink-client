/** Day-level codes that belong on the date picker rather than the time inputs. */
const DAY_DATE_CODES = ["START_TOO_SOON", "DAY_DUPLICATED", "DAY_SPAN_TOO_WIDE"];
/** Day-level codes about its shifts, shown on the grid row. */
const DAY_SHIFT_CODES = ["DAY_NO_ACTIVE_SHIFT", "DAY_SLOTS_OVER_LIMIT"];

/**
 * Server field path (camelCase, e.g. `schedule[1][0].minVolunteers`) → form field name.
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
      minVolunteers: "min_volunteers",
      maxVolunteers: "max_volunteers",
      leaderUserId: "leader_user_id",
      startAt: "start_time",
      endAt: "end_time",
      gatherAt: "gather_time",
    };
    return `schedule.${d}.${p}.${map[key] ?? "min_volunteers"}`;
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
    minVolunteersReason: "min_volunteers_reason",
  };
  return top[field] ?? null;
};
