import type { INotificationItem } from '@/apis/notification/models/notification';

export function getLocalizedNotificationText(
  item: INotificationItem,
  lang: string | undefined,
): { title: string; body: string } {
  const loc = (lang ?? 'en').toLowerCase().startsWith('vi') ? 'vi' : 'en';
  const raw = item.payload?.locales as
    | { en?: { title: string; body: string }; vi?: { title: string; body: string } }
    | undefined;
  const fromPack = raw?.[loc] ?? raw?.en;
  if (fromPack?.title != null && fromPack?.body != null) {
    return { title: fromPack.title, body: fromPack.body };
  }
  return { title: item.title, body: item.body };
}

export function getNotificationHref(
  kind: string,
  payload: Record<string, unknown> | undefined,
): string | null {
  const p = payload ?? {};
  const campaignId = typeof p.campaignId === 'string' ? p.campaignId : null;
  const reportId = typeof p.reportId === 'string' ? p.reportId : null;

  switch (kind) {
    case 'CAMPAIGN_CREATED':
    case 'CAMPAIGN_DONE':
      return campaignId ? `/campaigns/${campaignId}` : null;
    case 'VOLUNTEER_REQUEST':
      if (campaignId) return `/campaigns/${campaignId}`;
      if (typeof p.organizationId === 'string' && p.organizationId) {
        return `/organizations/${p.organizationId}`;
      }
      return null;
    case 'REPORT_STATUS':
    case 'REPORT_READY':
      return reportId ? `/incidents/${reportId}` : null;
    default:
      return null;
  }
}
