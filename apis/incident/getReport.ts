import requestApi from '@/utils/requestApi';
import { IGetReportsRequest, IGetReportsResponse } from './models/getReport';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';

const url = '/api/v1/reports/search';
const myReportsUrl = '/api/v1/reports/my';
const allReportsUrl = '/api/v1/reports/all';

export const getReports = async (params: IGetReportsRequest): Promise<IGetReportsResponse> => {
  return await requestApi.get<IGetReportsResponse>(url, params);
};

export const getMyReports = async (params: IGetReportsRequest): Promise<IGetReportsResponse> => {
  return await requestApi.get<IGetReportsResponse>(myReportsUrl, params);
};

export const getAllReports = async (params: any): Promise<IGetReportsResponse> => {
  return await requestApi.get<IGetReportsResponse>(allReportsUrl, params);
};

export const useGetAllReports = (
  params: any,
  options?: Omit<UseGetOptions<IGetReportsResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['all-reports', params],
    queryFn: () => getAllReports(params),
    ...options,
  });
};

export const useGetReports = (
  params: IGetReportsRequest,
  options?: Omit<UseGetOptions<IGetReportsResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['reports', params],
    queryFn: () => getReports(params),
    ...options,
  });
};

export const useGetMyReports = (
  params: IGetReportsRequest,
  options?: Omit<UseGetOptions<IGetReportsResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['my-reports', params],
    queryFn: () => getMyReports(params),
    ...options,
  });
};
