import { IBaseResponse } from "@/types/BaseResponse";

export interface IVoteRequest {
  resource_id: string;
  resource_type: string; // e.g., "report"
}

export interface IVoteData {
  vote: {
    resource_id: string;
    resource_type: string;
    value: number; // 1 for up, -1 for down, 0 for retracted
  };
}

export type IVoteResponse = IBaseResponse<IVoteData>;
