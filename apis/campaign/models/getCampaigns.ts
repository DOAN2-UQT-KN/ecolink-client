import { ICampaign } from './campaign';
import { IPaginationResponse } from '@/types/PaginationResponse';

export interface IGetCampaignsRequest {
  search?: string;
  status?: number;
  statuses?: string;
  organizationId?: string;
  page?: number;
  limit?: number;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  difficulty?: number;

  is_owner?: boolean;
  /** Admin review queue: leave out organizations the admin belongs to. */
  excludeMemberOrgs?: boolean;
}

export type IGetCampaignsResponse = IPaginationResponse<ICampaign[], 'campaigns'>;
