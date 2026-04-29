import requestApi from '@/utils/requestApi';
import { IBaseResponse } from '@/types/BaseResponse';

const base = '/api/v1/campaigns';

export interface IIssueAttendanceQrData {
  token: string;
  expires_at: string;
}

export const issueCampaignAttendanceQr = async (
  campaignId: string,
): Promise<IBaseResponse<IIssueAttendanceQrData>> => {
  return await requestApi.post<IBaseResponse<IIssueAttendanceQrData>>(
    `${base}/${campaignId}/attendance-qr`,
    {},
  );
};

export interface ICheckInAttendanceData {
  checked_in_at: string;
  already_checked_in: boolean;
}

export const checkInCampaignAttendance = async (
  campaignId: string,
  token: string,
): Promise<IBaseResponse<ICheckInAttendanceData>> => {
  return await requestApi.post<IBaseResponse<ICheckInAttendanceData>>(
    `${base}/${campaignId}/attendance-check-in`,
    { token },
  );
};
