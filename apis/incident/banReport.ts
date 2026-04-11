import requestApi from "@/utils/requestApi";
import { IBaseResponse } from "@/types/BaseResponse";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/reports";

export const banReport = async (id: string): Promise<IBaseResponse<unknown>> => {
  return await requestApi.put<IBaseResponse<unknown>>(`${url}/${id}/ban`, {});
};

export const useBanReport = (
  options?: UsePostOptions<IBaseResponse<unknown>, string>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: banReport,
    messageSuccess: {
      content: t("Report banned successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
