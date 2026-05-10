import requestApi from "@/utils/requestApi";
import type {
  IRedeemGiftRequest,
  IRedeemGiftResponse,
} from "@/apis/gift/models/gift";
import { usePost, type UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

export const exchangeGift = async (
  body: IRedeemGiftRequest,
): Promise<IRedeemGiftResponse> => {
  return await requestApi.post<IRedeemGiftResponse>(
    `/api/v1/gifts/${body.id}/exchange`,
    {},
  );
};

export const useExchangeGift = (
  options?: UsePostOptions<IRedeemGiftResponse, IRedeemGiftRequest>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: exchangeGift,
    queryKey: ["gifts"],
    messageSuccess: {
      content: t("Gift exchanged successfully"),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
