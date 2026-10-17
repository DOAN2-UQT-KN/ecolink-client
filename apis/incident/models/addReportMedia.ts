import { IBaseResponse } from "@/types/BaseResponse";
import { ICreateReportImage } from "./createReport";

export interface IAddReportMediaRequest {
  images: ICreateReportImage[];
}

export type IAddReportMediaResponse = IBaseResponse<unknown>;
