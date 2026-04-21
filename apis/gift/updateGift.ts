import requestApi from "@/utils/requestApi";
import type { IUpdateGiftRequest, IUpdateGiftResponse } from "@/apis/gift/models/gift";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const baseurl = "/api/v1/gifts";

export const updateGift = async ({
  id,
  data,
}: {
  id: string;
  data: IUpdateGiftRequest;
}): Promise<IUpdateGiftResponse> => {
  return await requestApi.put<IUpdateGiftResponse>(`${baseUrl}/${id}`, data);
};

export const useUpdateGift = (
  options?: UsePostOptions<
    IUpdateGiftResponse,
    { id: string; data: IUpdateGiftRequest }
  >,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: updateGift,
    queryKey: ["gifts"],
    messageSuccess: {
      content: t("Gift updated successfully"),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
