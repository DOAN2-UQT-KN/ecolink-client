import { ICreateReportRequest } from "@/apis/incident/models/createReport";

export interface IncidentFormValues {
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
  detailAddress: string;
  wasteTypes: string[];
  condition: string;
  pollutionLevels: string[];
  size: string;
  imageStrings: (string | File | Blob)[];
}

export const transformToApiData = (data: IncidentFormValues): ICreateReportRequest => {
  const condition = (data.condition || "").trim();
  const pollutionLevels = (data.pollutionLevels || []).map((s) => String(s).trim()).filter(Boolean);
  const wasteTypes = (data.wasteTypes || []).map((s) => String(s).trim()).filter(Boolean);
  const size = (data.size || "").trim();

  // Backend report model currently stores waste_type + severity_level.
  // Persist the user's additional selections without guessing by embedding them into description.
  const metaBits: string[] = [];
  if (wasteTypes.length) metaBits.push(`Waste type: ${wasteTypes.join(", ")}`);
  if (condition) metaBits.push(`Condition: ${condition}`);
  if (pollutionLevels.length) metaBits.push(`Pollution level: ${pollutionLevels.join(", ")}`);
  if (size) metaBits.push(`Size: ${size}`);

  const originalDesc = (data.description || "").trim();
  const metaLine = metaBits.length ? `\n\n---\n${metaBits.join(" | ")}` : "";

  return {
    title: data.title,
    description: `${originalDesc}${metaLine}`.trim(),
    waste_type: wasteTypes.join(", "),
    severity_level: data.size ? Number(data.size) : undefined,
    latitude: data.latitude,
    longitude: data.longitude,
    detail_address: data.detailAddress,
    image_urls: data.imageStrings as string[],
  };
};
