import type { IBaseResponse } from "@/types/BaseResponse";

export interface ISeason {
  id: string;
  label: string | null;
  kind: string;
  status: string;
  startsAt: string;
  endsAt: string;
}

export interface IAdminSeasonsQuery {
  page?: number;
  limit?: number;
}

export interface ICreateSeasonBody {
  label?: string | null;
  kind: string;
  startsAt: string;
  endsAt: string;
  status?: string;
}

export interface IPatchSeasonBody {
  label?: string | null;
  startsAt?: string;
  endsAt?: string;
  status?: string;
  kind?: string;
}

export interface ICloseSeasonOpenNextBody {
  nextLabel?: string;
}

export type IGetSeasonCurrentResponse = IBaseResponse<{
  season: ISeason | null;
}>;

export type IGetSeasonByIdResponse = IBaseResponse<{
  season: ISeason;
}>;

export type IGetAdminSeasonsResponse = IBaseResponse<{
  seasons: ISeason[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>;

export type ICreateAdminSeasonResponse = IBaseResponse<{
  season: ISeason;
}>;

export type IPatchAdminSeasonResponse = IBaseResponse<{
  season: ISeason;
}>;

export type IAdminFreezeSeasonResponse = IBaseResponse<{
  snapshotsWritten: number;
}>;

export type IAdminCloseSeasonAndOpenNextResponse = IBaseResponse<{
  closed: ISeason;
  next: ISeason;
}>;
