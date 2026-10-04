import requestApi from "@/utils/requestApi";
import { IBaseResponse } from "@/types/BaseResponse";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/campaigns";

/** Only before approval (or once blocked/expired); running campaigns are cancelled instead. */
export const deleteCampaign = async (id: string): Promise<IBaseResponse<unknown>> => {
  return await requestApi.delete<IBaseResponse<unknown>>(`${url}/${id}`);
};

export const useDeleteCampaign = (
  options?: UsePostOptions<IBaseResponse<unknown>, string>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: deleteCampaign,
    queryKey: ["my-campaigns"],
    messageSuccess: { content: t("Campaign deleted"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
