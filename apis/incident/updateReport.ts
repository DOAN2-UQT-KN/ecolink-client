import requestApi from "@/utils/requestApi";
import {
  IUpdateReportRequest,
  IUpdateReportResponse,
} from "./models/updateReport";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/reports";

export const updateReport = async ({
  id,
  data,
}: {
  id: string;
  data: IUpdateReportRequest;
}): Promise<IUpdateReportResponse> => {
  return await requestApi.put<IUpdateReportResponse>(`${url}/${id}`, data);
};

export const useUpdateReport = (
  options?: UsePostOptions<
    IUpdateReportResponse,
    { id: string; data: IUpdateReportRequest }
  >,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: updateReport,
    messageSuccess: {
      content: t("Report updated successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
