import { IIncident } from "@/apis/incident/models/incident";
import { IResource } from "@/apis/saved-resource/models/getResource";
import { ICreateCampaignRequest } from "@/apis/campaign/models/createCampaign";

export interface CampaignFormValues {
  organization_id: string;
  title: string;
  description: string;
  difficulty: number;
  selectedReports: IIncident[];
}

export const DEFAULT_CAMPAIGN_FORM_VALUES: CampaignFormValues = {
  organization_id: "",
  title: "",
  description: "",
  difficulty: 1,
  selectedReports: [],
};

export const difficultyOptions = [1, 2, 3, 4, 5];

export const transformToApiData = (
  data: CampaignFormValues,
): ICreateCampaignRequest => {
  return {
    organization_id: data.organization_id,
    title: data.title.trim(),
    description: data.description.trim(),
    difficulty: data.difficulty,
    report_ids: data.selectedReports.map((report) => report.id),
  };
};

export const mapResourceToIncident = (resource: IResource): IIncident | null => {
  const maybeIncident = (resource as unknown as { resource?: IIncident }).resource;
  if (maybeIncident?.id) {
    return maybeIncident;
  }

  const maybeData = (resource as unknown as { data?: IIncident }).data;
  if (maybeData?.id) {
    return maybeData;
  }

  if (resource.id) {
    return {
      id: resource.id,
      user_id: null,
      title: resource.name ?? "",
      description: resource.description ?? "",
      waste_type: null,
      severity_level: null,
      latitude: null,
      longitude: null,
      status: null,
      ai_verified: false,
      created_at: resource.created_at,
      updated_at: resource.updated_at,
      distance: 0,
      image_urls: [],
    };
  }

  return null;
};
