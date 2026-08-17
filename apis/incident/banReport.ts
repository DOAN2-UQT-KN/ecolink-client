import requestApi from "@/utils/requestApi";
import { IBaseResponse } from "@/types/BaseResponse";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/reports";

export type BanReportRequest = {
  id: string;
  reject_reason: string;
};

export const banReport = async (
  req: BanReportRequest,
): Promise<IBaseResponse<unknown>> => {
  return await requestApi.put<IBaseResponse<unknown>>(`${url}/${req.id}/ban`, {
    reject_reason: req.reject_reason,
  });
};

export const useBanReport = (
  options?: UsePostOptions<IBaseResponse<unknown>, BanReportRequest>,
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
