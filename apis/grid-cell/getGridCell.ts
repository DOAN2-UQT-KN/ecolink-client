import requestApi from "@/utils/requestApi";
import type { IGetGridCellResponse } from "@/apis/grid-cell/models/gridCell";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/admin/grid-cells";

export const getGridCell = async (
  cellKey: string,
): Promise<IGetGridCellResponse> => {
  return await requestApi.get<IGetGridCellResponse>(
    `${url}/${encodeURIComponent(cellKey)}`,
  );
};

export const useGetGridCell = (
  cellKey: string,
  options?: Omit<UseGetOptions<IGetGridCellResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["grid-cell", cellKey],
    queryFn: () => getGridCell(cellKey),
    enabled: Boolean(cellKey),
    ...options,
  });
};
