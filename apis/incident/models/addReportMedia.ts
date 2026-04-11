import { IBaseResponse } from "@/types/BaseResponse";

export interface IAddReportMediaRequest {
  image_urls: string[];
}

export type IAddReportMediaResponse = IBaseResponse<unknown>;
