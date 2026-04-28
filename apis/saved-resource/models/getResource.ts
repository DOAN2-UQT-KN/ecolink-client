import { IIncident } from '@/apis/incident/models/incident';
import { IPaginationResponse } from '@/types/PaginationResponse';

export interface IGetResourceRequest {
  page?: number;
  limit?: number;
  resource_type?: string; //"report"
  sort_by?: string;
  sort_order?: string;
}

export interface IResource {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  resource: IIncident;
}

export interface ISavedResourceItem {
  items: IResource[];
}
export interface IGetResourceResponse extends IPaginationResponse<
  ISavedResourceItem,
  'saved_resource'
> {}
