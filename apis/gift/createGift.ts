import requestApi from "@/utils/requestApi";
import type { ICreateGiftRequest, ICreateGiftResponse } from "@/apis/gift/models/gift";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/gifts";

export const createGift = async (data: ICreateGiftRequest): Promise<ICreateGiftResponse> => {
  return await requestApi.post<ICreateGiftResponse>(url, data);
};

export const useCreateGift = (
  options?: UsePostOptions<ICreateGiftResponse, ICreateGiftRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: createGift,
    queryKey: ["gifts"],
    messageSuccess: {
      content: t("Gift created successfully"),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
