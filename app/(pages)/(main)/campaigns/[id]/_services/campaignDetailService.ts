import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';

import type { ICampaign } from '@/apis/campaign/models/campaign';

/** Mock until tasks API is wired to campaign detail. */
export const MOCK_ARCHIVED_TASKS = 8;

function parseDate(value?: string | null): Date | null {
  if (value == null || !String(value).trim()) return null;
  const d = parseISO(String(value).trim());
  return isValid(d) ? d : null;
}

/**
 * Calendar days from campaign start to today (0 if start is in the future).
 */
export function getDaysSinceStart(startDate?: string | null): number | null {
  const start = parseDate(startDate);
  if (!start) return null;
  const n = differenceInCalendarDays(new Date(), start);
  return n < 0 ? 0 : n;
}

export function getMemberProgressPercent(current?: number | null, max?: number | null): number {
  const c = current ?? 0;
  const m = max ?? 0;
  if (m <= 0) return 0;
  return Math.min(100, Math.round((c / m) * 100));
}

export function parseCampaignDetailData(campaign: ICampaign) {
  return {
    currentMembers: campaign.current_members ?? 0,
    maxMembers: campaign.max_members ?? 0,
    daysSinceStart: getDaysSinceStart(campaign.start_date),
    memberProgress: getMemberProgressPercent(campaign.current_members, campaign.max_members),
    archivedTasksDisplay: MOCK_ARCHIVED_TASKS,
  };
}
