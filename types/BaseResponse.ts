export interface IBaseResponse<T = unknown> {
  success: boolean;
  code?: string;
  message?: string;
  data: T;
}
