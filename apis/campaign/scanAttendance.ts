import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';
import type { IScanResult } from './models/attendance';

const url = '/api/v1/campaigns';

/** Check in or out with a scanned code and the device's position. */
export const scanAttendance = (
  campaignId: string,
  body: { token: string; latitude: number; longitude: number; accuracy: number },
): Promise<IBaseResponse<IScanResult>> =>
  requestApi.post<IBaseResponse<IScanResult>>(`${url}/${campaignId}/attendance/scan`, body);
