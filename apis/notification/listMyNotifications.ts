import requestApi from '@/utils/requestApi';
import type { IListMyNotificationsResponse } from './models/notification';

const url = '/api/v1/notifications/my';

export async function listMyNotifications(params?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<IListMyNotificationsResponse> {
  return requestApi.get<IListMyNotificationsResponse>(url, {
    limit: params?.limit,
    unreadOnly: params?.unreadOnly ? 'true' : undefined,
  });
}
