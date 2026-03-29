import requestApi from "@/utils/requestApi";
import { IBaseResponse } from "@/types/BaseResponse";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/reports";

export const deleteReport = async (
  id: string,
): Promise<IBaseResponse<unknown>> => {
  return await requestApi.delete<IBaseResponse<unknown>>(`${url}/${id}`);
};

export const useDeleteReport = (
  options?: UsePostOptions<IBaseResponse<unknown>, string>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: deleteReport,
    messageSuccess: {
      content: t("Report deleted successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
