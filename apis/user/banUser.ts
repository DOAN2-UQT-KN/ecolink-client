import requestApi from "@/utils/requestApi";
import { IBaseResponse } from "@/types/BaseResponse";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";
import type { IAdminUser } from "./models/getUsers";

const url = "/api/v1/users";

export type BanUserRequest = {
  id: string;
  reject_reason: string;
};

export const banUser = async (
  req: BanUserRequest,
): Promise<IBaseResponse<{ user: IAdminUser }>> => {
  return await requestApi.put<IBaseResponse<{ user: IAdminUser }>>(
    `${url}/${req.id}/ban`,
    {
      reject_reason: req.reject_reason,
    },
  );
};

export const useBanUser = (
  options?: UsePostOptions<
    IBaseResponse<{ user: IAdminUser }>,
    BanUserRequest
  >,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: banUser,
    messageSuccess: {
      content: t("User banned successfully"),
      type: MessageType.Toast,
    },
    messageError: {
      type: MessageType.Toast,
    },
    ...options,
  });
};
