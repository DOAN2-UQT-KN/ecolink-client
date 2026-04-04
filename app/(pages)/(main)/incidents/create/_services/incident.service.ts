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
  imageString: string[];
}

export const transformToApiData = (data: IncidentFormValues): ICreateReportRequest => {
  return {
    title: data.title,
    description: data.description,
    wasteType: data.wasteTypes.join(", "),
    severityLevel: data.size ? Number(data.size) : undefined,
    latitude: data.latitude,
    longitude: data.longitude,
    detailAddress: data.detailAddress,
    imageUrls: data.imageString,
  };
};
