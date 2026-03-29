import requestApi from "@/utils/requestApi";
import {
  ICreateReportRequest,
  ICreateReportResponse,
} from "./models/createReport";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/reports";

export const createReport = async (
  req: ICreateReportRequest,
): Promise<ICreateReportResponse> => {
  return await requestApi.post<ICreateReportResponse>(url, req);
};

export const useCreateReport = (
  options: UsePostOptions<ICreateReportResponse, ICreateReportRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: createReport,
    messageSuccess: {
      content: t("Report created successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
