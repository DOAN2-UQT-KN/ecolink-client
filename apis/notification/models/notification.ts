import type { IBaseResponse } from '@/types/BaseResponse';

export interface INotificationLocaleBundle {
  title: string;
  body: string;
}

export interface INotificationItem {
  id: string;
  userId: string | null;
  type: string;
  kind: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface INotificationListData {
  items: INotificationItem[];
  unreadCount: number;
}

export interface IListMyNotificationsResponse extends IBaseResponse<INotificationListData> {}

export interface IMarkNotificationReadResponse extends IBaseResponse<INotificationItem> {}
