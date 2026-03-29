import { IBaseResponse } from "@/types/BaseResponse";
import { IIncident } from "./incident";

export type IGetReportDetailResponse = IBaseResponse<{
  report: IIncident;
}>;
