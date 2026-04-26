import requestApi from "@/utils/requestApi";
import { IBaseResponse } from "@/types/BaseResponse";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/reports";

export const verifyReport = async (id: string): Promise<IBaseResponse<unknown>> => {
  return await requestApi.put<IBaseResponse<unknown>>(`${url}/${id}/verify`, {});
};

export const useVerifyReport = (
  options?: UsePostOptions<IBaseResponse<unknown>, string>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: verifyReport,
    messageSuccess: {
      content: t("Report verified successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
