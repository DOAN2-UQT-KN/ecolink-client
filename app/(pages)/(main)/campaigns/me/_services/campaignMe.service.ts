"use client";

import { useTranslation } from "react-i18next";

import requestApi from "@/utils/requestApi";
import { MessageType } from "@/utils/showMessage";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { IBaseResponse } from "@/types/BaseResponse";

export interface IUpdateCampaignMeRequest {
  title?: string;
  description?: string;
  banner?: string;
  start_date?: string;
  end_date?: string;
}

type UpdateCampaignMeParams = {
  id: string;
  data: IUpdateCampaignMeRequest;
};

const url = "/api/v1/campaigns";

export const updateCampaignMe = async ({
  id,
  data,
}: UpdateCampaignMeParams): Promise<IBaseResponse<unknown>> => {
  return await requestApi.put<IBaseResponse<unknown>>(`${url}/${id}`, data);
};

export const useUpdateCampaignMe = (
  options?: UsePostOptions<IBaseResponse<unknown>, UpdateCampaignMeParams>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: updateCampaignMe,
    messageSuccess: {
      content: t("Campaign updated successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
