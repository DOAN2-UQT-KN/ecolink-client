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

const SOS_NOTIFICATION_KINDS = new Set([
  'SOS_TEAM_ALERT',
  'SOS_MEDICAL_ALERT',
  'SOS_HELP_INVITE',
  'SOS_HAZARD_WARNING',
  'SOS_NEARBY_ORG_REQUEST',
  'SOS_ADMIN_ALERT',
  'SOS_OWNER_ESCALATION',
  'SOS_ESCALATED',
  'SOS_LOCATION_CHANGED',
  'SOS_EXPIRED',
  'SOS_NO_LONGER_NEEDED',
  'SOS_ABUSE_REVIEW',
]);

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

  // SOS (spec "Tương tác 2 chiều"): every SOS_* notification opens the SOS.
  if (SOS_NOTIFICATION_KINDS.has(kind)) {
    const sosId =
      typeof p.sosId === 'number' || typeof p.sosId === 'string'
        ? p.sosId
        : typeof p.sos_id === 'number' || typeof p.sos_id === 'string'
          ? p.sos_id
          : null;
    return sosId != null ? `/sos/${sosId}` : null;
  }

  switch (kind) {
    case 'CAMPAIGN_CREATED':
    case 'CAMPAIGN_DONE':
    case 'CAMPAIGN_VERIFY_INVITE':
    case 'CAMPAIGN_COMPLETION_APPROVED_BY_ADMIN':
    case 'CAMPAIGN_COMPLETION_REJECTED_BY_ADMIN':
    case 'CAMPAIGN_APPROVED':
    case 'CAMPAIGN_REGISTRATION_DIGEST':
    case 'CAMPAIGN_SHIFT_UNDERSTAFFED':
    case 'CAMPAIGN_SHIFT_OVER_MAX':
    case 'CAMPAIGN_JOIN_INVITE':
    case 'CAMPAIGN_SHIFT_CLOSED':
    case 'CAMPAIGN_CREATOR_TRANSFERRED':
    case 'CAMPAIGN_SHIFT_LEADER_REMOVED':
    case 'CAMPAIGN_UPDATED_NEEDS_REVIEW':
    case 'CAMPAIGN_REREVIEW_EXPIRED':
    case 'CAMPAIGN_SHIFT_REMINDER':
    case 'CAMPAIGN_RESULT_VERIFIED':
    case 'CAMPAIGN_RESULT_REJECTED':
      return campaignId ? `/campaigns/${campaignId}` : null;
    // Result verification: residents nearby vote, the reporters confirm their meeting point.
    case 'CAMPAIGN_COMPLETION_VERIFY_INVITE':
      return campaignId ? `/campaigns/${campaignId}/verify` : null;
    case 'CAMPAIGN_MEETING_POINT_CONFIRM_REQUEST':
    case 'CAMPAIGN_MEETING_POINT_CONFIRM_REMINDER':
    case 'CAMPAIGN_MEETING_POINT_FLAGGED':
    case 'CAMPAIGN_MEETING_POINT_REJECTED': {
      if (!campaignId) return null;
      const meetingPointId =
        typeof p.meetingPointId === 'string'
          ? p.meetingPointId
          : typeof p.meeting_point_id === 'string'
            ? p.meeting_point_id
            : null;
      // The page finds the meeting point holding `?report=` when the id is missing.
      if (meetingPointId) return `/campaigns/${campaignId}/verify?point=${encodeURIComponent(meetingPointId)}`;
      return reportId
        ? `/campaigns/${campaignId}/verify?report=${encodeURIComponent(reportId)}`
        : `/campaigns/${campaignId}/verify`;
    }
    case 'CAMPAIGN_SHIFT_RESULT_MISSING': {
      // Spec 4.2: straight to the shift, where its result is submitted.
      const shiftId =
        typeof p.shiftId === 'string' ? p.shiftId : typeof p.shift_id === 'string' ? p.shift_id : null;
      if (!campaignId) return null;
      return shiftId ? `/campaigns/${campaignId}/shifts/${shiftId}` : `/campaigns/${campaignId}`;
    }
    case 'CAMPAIGN_COMPLETION_PENDING_ADMIN':
      return campaignId ? `/admin/campaigns?highlight=${campaignId}` : '/admin/campaigns';
    case 'ORGANIZATION_REJECTED':
      return '/organizations/me';
    case 'VOLUNTEER_REQUEST':
    case 'VOLUNTEER_APPROVED':
    case 'VOLUNTEER_REJECTED':
    case 'ORGANIZATION_APPROVED':
    case 'ORG_INVITATION_PENDING':
    case 'ORG_INVITATION_REJECTED':
    case 'ORG_MEMBERSHIP_CHANGED':
    case 'ORG_OWNER_CHANGE_APPROVAL_REQUEST':
    case 'ORG_OWNER_CHANGE_DECIDED':
    case 'ORG_OWNER_REMOVAL_PROPOSED':
    case 'ORG_OWNER_LEFT': {
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
    }
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
