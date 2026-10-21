import requestApi from "@/utils/requestApi";
import type {
  IUpdatePointRulesRequest,
  IUpdatePointRulesResponse,
} from "@/apis/gamification/models/pointRules";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/admin/gamification/point-rules";

export const updatePointRules = async (
  data: IUpdatePointRulesRequest,
): Promise<IUpdatePointRulesResponse> => {
  return await requestApi.patch<IUpdatePointRulesResponse>(url, data);
};

export const useUpdatePointRules = (
  options?: UsePostOptions<IUpdatePointRulesResponse, IUpdatePointRulesRequest>,
) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  return usePost({
    mutationFn: updatePointRules,
    queryKey: ["admin-point-rules"],
    messageSuccess: { content: t("Point rules saved"), type: MessageType.Toast },
    messageError: { type: MessageType.Toast },
    // Every save adds a history row.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-point-rule-history"] }),
    ...options,
  });
};
