import requestApi from "@/utils/requestApi";
import type { IRecomputeGridCellsResponse } from "@/apis/grid-cell/models/gridCell";
import { usePost, UsePostOptions } from "@/hooks/reactQuery";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/utils/showMessage";

const url = "/api/v1/admin/grid-cells/recompute";

export const recomputeGridCells =
  async (): Promise<IRecomputeGridCellsResponse> => {
    return await requestApi.post<IRecomputeGridCellsResponse>(url, {});
  };

export const useRecomputeGridCells = (
  options?: UsePostOptions<IRecomputeGridCellsResponse, void>,
) => {
  const { t } = useTranslation();
  return usePost({
    mutationFn: recomputeGridCells,
    queryKey: ["grid-cells"],
    messageSuccess: {
      content: t("Grid cells recomputed"),
      type: MessageType.Toast,
    },
    messageError: { type: MessageType.Toast },
    ...options,
  });
};
