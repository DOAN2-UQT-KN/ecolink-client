import type { INotificationItem } from '@/apis/notification/models/notification';

type LocaleBundle = { title?: string; body?: string };

export function getLocalizedNotificationText(
  item: INotificationItem,
  lang: string | undefined,
): { title: string; body: string } {
  const loc = (lang ?? 'en').toLowerCase().startsWith('vi') ? 'vi' : 'en';
  const raw = item.payload?.locales as
    | { en?: LocaleBundle; vi?: LocaleBundle }
    | undefined;

  const primary = raw?.[loc];
  const fallback = loc === 'vi' ? raw?.en : raw?.vi;
  const fromPack = primary?.title != null && primary?.body != null ? primary : fallback;

  if (fromPack?.title != null && fromPack?.body != null) {
    return { title: fromPack.title, body: fromPack.body };
  }

  const title =
    primary?.title?.trim() ||
    fallback?.title?.trim() ||
    item.title?.trim() ||
    '';
  const body =
    primary?.body?.trim() ||
    fallback?.body?.trim() ||
    item.body?.trim() ||
    '';

  return { title, body };
}

export function getNotificationHref(
  kind: string,
  payload: Record<string, unknown> | undefined,
): string | null {
  const p = payload ?? {};
  const campaignId =
    typeof p.campaignId === 'string'
      ? p.campaignId
      : typeof p.campaign_id === 'string'
        ? p.campaign_id
        : null;
  const reportId =
    typeof p.reportId === 'string'
      ? p.reportId
      : typeof p.report_id === 'string'
        ? p.report_id
        : null;

  switch (kind) {
    case 'CAMPAIGN_CREATED':
    case 'CAMPAIGN_DONE':
    case 'CAMPAIGN_VERIFY_INVITE':
    case 'CAMPAIGN_COMPLETION_VERIFY_INVITE':
    case 'CAMPAIGN_COMPLETION_APPROVED_BY_ADMIN':
    case 'CAMPAIGN_COMPLETION_REJECTED_BY_ADMIN':
      return campaignId ? `/campaigns/${campaignId}` : null;
    case 'CAMPAIGN_COMPLETION_PENDING_ADMIN':
      return campaignId ? `/admin/campaigns?highlight=${campaignId}` : '/admin/campaigns';
    case 'ORGANIZATION_REJECTED':
      return '/organizations/me';
    case 'VOLUNTEER_REQUEST':
    case 'VOLUNTEER_APPROVED':
    case 'VOLUNTEER_REJECTED':
    case 'ORGANIZATION_APPROVED':
      if (campaignId) return `/campaigns/${campaignId}`;
      const organizationSlug =
        typeof p.organizationSlug === "string"
          ? p.organizationSlug
          : typeof p.organization_slug === "string"
            ? p.organization_slug
            : null;
      if (organizationSlug) {
        return `/organizations/${organizationSlug}`;
      }
      if (typeof p.organizationId === "string" && p.organizationId) {
        return `/organizations/${p.organizationId}`;
      }
      if (typeof p.organization_id === "string" && p.organization_id) {
        return `/organizations/${p.organization_id}`;
      }
      return null;
    case 'REPORT_REJECTED':
      return '/incidents/me';
    case 'REPORT_STATUS':
    case 'REPORT_READY':
    case 'REPORT_APPROVED':
      return reportId ? `/incidents/${reportId}` : null;
    default:
      return null;
  }
}
