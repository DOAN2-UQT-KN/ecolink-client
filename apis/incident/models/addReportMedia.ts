import { IBaseResponse } from "@/types/BaseResponse";

export interface IAddReportMediaRequest {
  imageUrls: string[];
}

export type IAddReportMediaResponse = IBaseResponse<unknown>;
