import requestApi from '@/utils/requestApi';
import type { IMarkNotificationReadResponse } from './models/notification';

export async function markNotificationRead(notificationId: string): Promise<IMarkNotificationReadResponse> {
  return requestApi.patch<IMarkNotificationReadResponse>(
    `/api/v1/notifications/${notificationId}/read`,
    {},
  );
}
