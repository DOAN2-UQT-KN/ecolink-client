import requestApi from "@/utils/requestApi";
import {
  ICreateReportRequest,
  ICreateReportResponse,
} from "./models/createReport";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/reports";

export type CreateReportVariables = {
  data: ICreateReportRequest;
  /** Same key on every retry of one form fill, so the server creates one report. */
  idempotencyKey: string;
};

export const createReport = async ({
  data,
  idempotencyKey,
}: CreateReportVariables): Promise<ICreateReportResponse> => {
  return await requestApi.post<ICreateReportResponse>(url, data, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
};

export const useCreateReport = (
  options: UsePostOptions<ICreateReportResponse, CreateReportVariables>,
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
