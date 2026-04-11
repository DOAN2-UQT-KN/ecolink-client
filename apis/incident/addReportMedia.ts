import requestApi from "@/utils/requestApi";
import {
  IAddReportMediaRequest,
  IAddReportMediaResponse,
} from "./models/addReportMedia";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/reports";

export const addReportMedia = async ({
  id,
  data,
}: {
  id: string;
  data: IAddReportMediaRequest;
}): Promise<IAddReportMediaResponse> => {
  return await requestApi.post<IAddReportMediaResponse>(
    `${url}/${id}/media`,
    data,
  );
};

export const useAddReportMedia = (
  options?: UsePostOptions<
    IAddReportMediaResponse,
    { id: string; data: IAddReportMediaRequest }
  >,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: addReportMedia,
    messageSuccess: {
      content: t("Media added successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
