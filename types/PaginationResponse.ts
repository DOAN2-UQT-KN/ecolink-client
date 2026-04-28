export interface IPaginationResponse<T = unknown, K extends string = 'items'> {
  success: boolean;
  code?: string;
  message?: string;
  data: {
    [key in K]: T;
  } & {
    total: number;
    page: number;
    limit: number;
  };
}
