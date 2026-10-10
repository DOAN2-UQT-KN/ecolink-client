import { IBaseResponse } from "@/types/BaseResponse";
import { ICampaign } from "./campaign";

export type IGetCampaignByIdResponse = IBaseResponse<{
  campaign: ICampaign;
}>;

export type MarkDoneCampaignParams = {
  id: string;
  /** One entry per trash report no shift handled, with the reason (spec 5.1). */
  unhandled?: { report_id: string; reason: string }[];
};
