import requestApi from "@/utils/requestApi";
import type {
  IGetGridCellsRequest,
  IGetGridCellsResponse,
} from "@/apis/grid-cell/models/gridCell";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/admin/grid-cells";

export const getGridCells = async (
  req: IGetGridCellsRequest,
): Promise<IGetGridCellsResponse> => {
  return await requestApi.get<IGetGridCellsResponse>(url, req);
};

export const useGetGridCells = (
  req: IGetGridCellsRequest,
  options?: Omit<UseGetOptions<IGetGridCellsResponse>, "queryKey" | "queryFn">,
) => {
  return useGet({
    queryKey: ["grid-cells", req],
    queryFn: () => getGridCells(req),
    ...options,
  });
};
