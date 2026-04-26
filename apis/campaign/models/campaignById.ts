import { IBaseResponse } from "@/types/BaseResponse";
import { ICampaign } from "./campaign";

export type IGetCampaignByIdResponse = IBaseResponse<{
  campaign: ICampaign;
}>;
