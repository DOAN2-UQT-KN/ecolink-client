import { ICreateReportRequest } from "@/apis/incident/models/createReport";

export { SEVERITY_MIN, SEVERITY_MAX } from "@/constants/severity";

export interface IncidentFormValues {
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
  detailAddress: string;
  wasteTypes: string[];
  condition: string;
  severityLevel: number;
  imageStrings: (string | File | Blob)[];
}

export const transformToApiData = (data: IncidentFormValues): ICreateReportRequest => {
  const condition = (data.condition || "").trim();
  const wasteTypes = (data.wasteTypes || []).map((s) => String(s).trim()).filter(Boolean);

  return {
    title: data.title,
    description: (data.description || "").trim(),
    waste_type: wasteTypes.length ? wasteTypes.join(",") : undefined,
    condition: condition || undefined,
    severity_level: data.severityLevel,
    latitude: data.latitude,
    longitude: data.longitude,
    detail_address: data.detailAddress,
    image_urls: data.imageStrings as string[],
  };
};
