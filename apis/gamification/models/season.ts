import type { IBaseResponse } from "@/types/BaseResponse";

export interface ISeason {
  id: string;
  label: string | null;
  kind: string;
  status: string;
  startsAt: string;
  endsAt: string;
}

export type IGetSeasonCurrentResponse = IBaseResponse<{
  season: ISeason | null;
}>;

export type IGetSeasonByIdResponse = IBaseResponse<{
  season: ISeason;
}>;
