import type { IBaseResponse } from "@/types/BaseResponse";

export interface IUserSeasonPointsRow {
  seasonId: string;
  label: string | null;
  kind: string;
  status: string;
  startsAt: string;
  endsAt: string;
  crp: number;
  vrp: number;
  sp: number;
}

export interface IGetGamificationPointsBySeasonRequest {
  page?: number;
  limit?: number;
}

export type IGetGamificationPointsBySeasonResponse = IBaseResponse<{
  seasons: IUserSeasonPointsRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}>;
