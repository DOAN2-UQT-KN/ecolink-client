import {
  ICreateReportImage,
  ICreateReportRequest,
} from "@/apis/incident/models/createReport";
import type { ICaptureUpload } from "@/apis/incident/models/capture";
import type { ReportCategory, WasteType } from "@/apis/incident/models/verification";

export { SEVERITY_MIN, SEVERITY_MAX } from "@/constants/severity";

export const MAX_INCIDENT_IMAGES = 10;

export interface IncidentImage {
  /** Blob before upload; the Cloudinary URL once uploaded, so a retry does not upload again. */
  source: string | File | Blob;
  /** Only for photos taken with "Take photo" while a capture session was issued. */
  capture?: { id: string; expiresAt: string; upload: ICaptureUpload };
}

export interface IncidentFormValues {
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
  detailAddress: string;
  category: ReportCategory | "";
  wasteTypes: WasteType[];
  condition: string;
  severityLevel: number;
  images: IncidentImage[];
}

export const transformToApiData = (
  data: IncidentFormValues,
  images: ICreateReportImage[],
): ICreateReportRequest => {
  const condition = (data.condition || "").trim();

  return {
    title: data.title,
    description: (data.description || "").trim(),
    category: data.category as ReportCategory,
    waste_types: data.wasteTypes,
    condition: condition || undefined,
    severity_level: data.severityLevel,
    latitude: data.latitude,
    longitude: data.longitude,
    detail_address: data.detailAddress,
    images,
  };
};

const SAME_NAME_FIELDS = new Set<string>([
  "title",
  "description",
  "category",
  "wasteTypes",
  "latitude",
  "longitude",
  "detailAddress",
  "severityLevel",
  "condition",
]);

/**
 * Server validation `path` (camelCase, e.g. `images[0].url`) → form field; null = show it as a
 * form-level error.
 */
export function mapValidationPath(path: string | undefined): keyof IncidentFormValues | null {
  if (!path) return null;
  if (/^(images|imageUrls)(\[\d+\](\.\w+)?)?$/.test(path)) return "images";
  return SAME_NAME_FIELDS.has(path) ? (path as keyof IncidentFormValues) : null;
}
