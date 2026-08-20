import type { IUser } from '@/apis/auth/models/user';

export const NOTIFICATION_PREFERENCE_KEYS = [
  'campaignNew',
  'campaignNearbyVerify',
  'campaignDone',
  'campaignCompletionRejected',
  'volunteerRequest',
  'reportStatus',
] as const;

export type NotificationPreferenceKey =
  (typeof NOTIFICATION_PREFERENCE_KEYS)[number];

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  campaignNew: true,
  campaignNearbyVerify: true,
  campaignDone: true,
  campaignCompletionRejected: true,
  volunteerRequest: true,
  reportStatus: true,
};

/** API JSON uses snake_case keys after identity case-transform. */
const API_KEY_TO_PREF: Record<string, NotificationPreferenceKey> = {
  campaign_new: 'campaignNew',
  campaign_nearby_verify: 'campaignNearbyVerify',
  campaign_done: 'campaignDone',
  campaign_completion_rejected: 'campaignCompletionRejected',
  volunteer_request: 'volunteerRequest',
  report_status: 'reportStatus',
};

export const NOTIFICATION_PREFERENCE_LABEL_KEYS: Record<
  NotificationPreferenceKey,
  string
> = {
  campaignNew: 'Notify: new organization campaigns',
  campaignNearbyVerify: 'Notify: verify nearby campaigns',
  campaignDone: 'Notify: campaign completed',
  campaignCompletionRejected: 'Notify: completion rejected by admin',
  volunteerRequest: 'Notify: volunteer requests, approvals, and rejections',
  reportStatus: 'Notify: report status updates',
};

export function mergeNotificationPreferences(stored: unknown): NotificationPreferences {
  const base = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  if (stored == null || typeof stored !== 'object' || Array.isArray(stored)) {
    return base;
  }
  for (const [rawKey, value] of Object.entries(stored as Record<string, unknown>)) {
    if (typeof value !== 'boolean') continue;
    const key =
      (NOTIFICATION_PREFERENCE_KEYS as readonly string[]).includes(rawKey)
        ? (rawKey as NotificationPreferenceKey)
        : API_KEY_TO_PREF[rawKey];
    if (key) base[key] = value;
  }
  return base;
}

export function readUserNotificationPreferences(
  user: IUser | null | undefined,
): NotificationPreferences {
  const raw =
    user?.notification_preferences ?? user?.notificationPreferences ?? null;
  return mergeNotificationPreferences(raw);
}

export function toApiNotificationPreferencesPatch(
  prefs: Partial<NotificationPreferences>,
): Record<string, boolean> {
  const map: Record<NotificationPreferenceKey, string> = {
    campaignNew: 'campaign_new',
    campaignNearbyVerify: 'campaign_nearby_verify',
    campaignDone: 'campaign_done',
    campaignCompletionRejected: 'campaign_completion_rejected',
    volunteerRequest: 'volunteer_request',
    reportStatus: 'report_status',
  };
  const out: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(prefs) as [NotificationPreferenceKey, boolean][]) {
    if (typeof value === 'boolean') out[map[key]] = value;
  }
  return out;
}
