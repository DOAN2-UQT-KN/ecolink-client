import { ICreateReportRequest } from "@/apis/incident/models/createReport";

export const SEVERITY_MIN = 1;
export const SEVERITY_MAX = 5;

export interface IncidentFormValues {
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
  detailAddress: string;
  wasteTypes: string[];
  condition: string;
  pollutionLevels: string[];
  severityLevel: number;
  imageStrings: (string | File | Blob)[];
}

export const transformToApiData = (data: IncidentFormValues): ICreateReportRequest => {
  const condition = (data.condition || "").trim();
  const pollutionLevels = (data.pollutionLevels || []).map((s) => String(s).trim()).filter(Boolean);
  const wasteTypes = (data.wasteTypes || []).map((s) => String(s).trim()).filter(Boolean);

  // Backend report model stores waste_type + severity_level.
  // Persist extra form selections by embedding them into description.
  const metaBits: string[] = [];
  if (wasteTypes.length) metaBits.push(`Waste type: ${wasteTypes.join(", ")}`);
  if (condition) metaBits.push(`Condition: ${condition}`);
  if (pollutionLevels.length) metaBits.push(`Pollution level: ${pollutionLevels.join(", ")}`);

  const originalDesc = (data.description || "").trim();
  const metaLine = metaBits.length ? `\n\n---\n${metaBits.join(" | ")}` : "";

  return {
    title: data.title,
    description: `${originalDesc}${metaLine}`.trim(),
    waste_type: wasteTypes.join(", "),
    severity_level: data.severityLevel,
    latitude: data.latitude,
    longitude: data.longitude,
    detail_address: data.detailAddress,
    image_urls: data.imageStrings as string[],
  };
};
