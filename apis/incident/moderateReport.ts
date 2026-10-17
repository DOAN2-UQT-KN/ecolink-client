import requestApi from "@/utils/requestApi";
import {
  IModerateReportRequest,
  IModerateReportResponse,
} from "./models/moderation";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/reports";

export const moderateReport = async ({
  id,
  data,
}: IModerateReportRequest): Promise<IModerateReportResponse> => {
  return await requestApi.post<IModerateReportResponse>(
    `${url}/${id}/moderation`,
    data,
  );
};

export const useModerateReport = (
  options?: UsePostOptions<IModerateReportResponse, IModerateReportRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: moderateReport,
    queryKey: ["reports", "moderation"],
    messageSuccess: {
      content: t("Report moderated"),
      type: MessageType.Toast,
    },
    ...options,
  });
};
