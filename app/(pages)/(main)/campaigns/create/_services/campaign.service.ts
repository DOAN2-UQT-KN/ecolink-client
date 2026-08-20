import { IIncident } from "@/apis/incident/models/incident";
import { IResource } from "@/apis/saved-resource/models/getResource";
import { ICreateCampaignRequest } from "@/apis/campaign/models/createCampaign";
import { STATUS } from "@/constants/status";
import { DIFFICULTY_MIN, clampDifficulty } from "@/constants/difficulty";

export const TITLE_MAX_LENGTH = 200;
export const DETAIL_ADDRESS_MAX_LENGTH = 255;

export interface CampaignFormValues {
  organization_id: string;
  title: string;
  description: string;
  banner?: string | File | Blob;
  difficulty: number;
  start_date?: string;
  end_date?: string;
  latitude?: number;
  longitude?: number;
  detail_address: string;
  selectedReports: IIncident[];
}

export const DEFAULT_CAMPAIGN_FORM_VALUES: CampaignFormValues = {
  organization_id: "",
  title: "",
  description: "",
  banner: undefined,
  difficulty: DIFFICULTY_MIN,
  start_date: undefined,
  end_date: undefined,
  latitude: undefined,
  longitude: undefined,
  detail_address: "",
  selectedReports: [],
};

export const truncateDetailAddress = (value?: string | null): string => {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length <= DETAIL_ADDRESS_MAX_LENGTH) {
    return trimmed;
  }
  return trimmed.slice(0, DETAIL_ADDRESS_MAX_LENGTH);
};

export const transformToApiData = (
  data: CampaignFormValues,
): ICreateCampaignRequest => {
  const description = data.description.trim() || undefined;
  const detailAddress = truncateDetailAddress(data.detail_address) || undefined;
  const reportIds = data.selectedReports
    .filter((report) => report.status === STATUS.TODO)
    .map((report) => report.id);

  return {
    organization_id: data.organization_id,
    title: data.title.trim().slice(0, TITLE_MAX_LENGTH),
    description,
    banner: typeof data.banner === "string" ? data.banner : undefined,
    difficulty: clampDifficulty(data.difficulty),
    start_date: data.start_date,
    end_date: data.end_date,
    latitude: data.latitude,
    longitude: data.longitude,
    detail_address: detailAddress,
    report_ids: reportIds.length > 0 ? reportIds : undefined,
  };
};

export const mapResourceToIncident = (resource: IResource): IIncident | null => {
  const nestedIncident = resource.resource;
  if (nestedIncident?.id) {
    return nestedIncident;
  }

  return null;
};
