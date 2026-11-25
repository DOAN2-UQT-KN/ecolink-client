import type { IBaseResponse } from "@/types/BaseResponse";

export type GridCellSort =
  | "submitted"
  | "verified"
  | "last_report"
  | "last_cleaned"
  | "cleanup";

export interface IGridCell {
  cell_key: string;
  grid_size_m: number;
  center_lat: number;
  center_lng: number;
  submitted_count: number;
  verified_count: number;
  last_report_at: string | null;
  cleanup_count: number;
  last_cleaned_at: string | null;
}

export interface IGetGridCellsRequest {
  page: number;
  limit: number;
  sort: GridCellSort;
  min_reports?: number;
  max_reports?: number;
  only_cleaned?: boolean;
}

export type IGetGridCellsResponse = IBaseResponse<{
  items: IGridCell[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}>;

export interface IGridCellReport {
  id: string;
  title: string | null;
  status: number | string;
  is_verify: boolean;
  severity_level: number | string | null;
  created_at: string;
}

export interface IGridCellCleanup {
  id: string;
  campaign_id: string;
  shift_id: string;
  cleaned_at: string;
  outcome: string;
  report_count: number;
}

export type IGetGridCellResponse = IBaseResponse<{
  cell: IGridCell;
  reports: IGridCellReport[];
  cleanups: IGridCellCleanup[];
}>;

export type IRecomputeGridCellsResponse = IBaseResponse<{ cells: number }>;
