import requestApi from '@/utils/requestApi';
import type {
  IGetGiftSourceReportRequest,
  IGetGiftSourceReportResponse,
} from '@/apis/gift-source/models/giftSource';
import { useGet, UseGetOptions } from '@/hooks/reactQuery';

const url = '/api/v1/admin/gift-sources';

export const getGiftSourceReport = async ({
  id,
  ...params
}: IGetGiftSourceReportRequest): Promise<IGetGiftSourceReportResponse> => {
  return await requestApi.get<IGetGiftSourceReportResponse>(`${url}/${id}/report`, params);
};

export const useGetGiftSourceReport = (
  req: IGetGiftSourceReportRequest,
  options?: Omit<UseGetOptions<IGetGiftSourceReportResponse>, 'queryKey' | 'queryFn'>,
) => {
  return useGet({
    queryKey: ['gift-sources', 'report', req],
    queryFn: () => getGiftSourceReport(req),
    enabled: Boolean(req.id),
    ...options,
  });
};

/** CSV file for the same report; fetched as a blob because the route needs the Bearer token. */
export const downloadGiftSourceReportCsv = async ({
  id,
  ...params
}: IGetGiftSourceReportRequest): Promise<Blob> => {
  return await requestApi.get<Blob>(`${url}/${id}/report`, { ...params, format: 'csv' }, { responseType: 'blob' });
};
