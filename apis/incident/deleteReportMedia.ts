import requestApi from "@/utils/requestApi";
import { IBaseResponse } from "@/types/BaseResponse";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/reports";

export const deleteReportMedia = async (
  id: string,
): Promise<IBaseResponse<unknown>> => {
  return await requestApi.delete<IBaseResponse<unknown>>(`${url}/${id}/media`);
};

export const useDeleteReportMedia = (
  options?: UsePostOptions<IBaseResponse<unknown>, string>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: deleteReportMedia,
    messageSuccess: {
      content: t("Media deleted successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
