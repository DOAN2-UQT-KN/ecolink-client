import type { IBaseResponse } from '@/types/BaseResponse';

export interface ISOS {
  id: string;
  content: string;
  phone: string;
  status: number;
  campaign_id?: string | null;
  campaign?: {
    id: string;
    title: string;
    latitude?: number | null;
    longitude?: number | null;
    detail_address?: string | null;
  } | null;
  latitude?: number | null;
  longitude?: number | null;
  detail_address?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IGetSOSRequest {
  page?: number;
  limit?: number;
  campaign_id?: string;
  status?: number;
}

export interface ISOSListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type IGetSOSResponse = IBaseResponse<{
  sos: ISOS[];
  meta?: ISOSListMeta;
}>;

export interface ICreateSOSRequest {
  content: string;
  phone: string;
  campaign_id?: string;
}

export type ICreateSOSResponse = IBaseResponse<{ sos: ISOS }>;
