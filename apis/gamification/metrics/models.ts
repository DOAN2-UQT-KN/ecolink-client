import type { IBaseResponse } from "@/types/BaseResponse";

/** Logical metric table for badge rule builder (reward-service catalog). */
export interface IMetricTable {
  id: string;
  key: string;
  label: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Selectable column metadata for a metric table. */
export interface IMetricColumn {
  id: string;
  tableId: string;
  metricTableKey: string;
  metricTableLabel: string;
  key: string;
  label: string;
  /** FE hint: e.g. `integer`, `number`. */
  valueType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IGetMetricTablesRequest {
  /** Case-insensitive contains filter on table label */
  label?: string;
}

export interface IGetMetricColumnsRequest {
  label?: string;
  metricTableId?: string;
}

export type IGetMetricTablesResponse = IBaseResponse<{
  tables: IMetricTable[];
}>;

export type IGetMetricColumnsResponse = IBaseResponse<{
  columns: IMetricColumn[];
}>;
