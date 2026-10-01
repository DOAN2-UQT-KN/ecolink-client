import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';

import type { ICampaign } from '@/apis/campaign/models/campaign';
import { campaignDateRange } from '@/constants/campaignLifecycle';

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

export function parseCampaignDetailData(campaign: ICampaign) {
  return {
    currentMembers: campaign.current_members ?? 0,
    daysSinceStart: getDaysSinceStart(campaignDateRange(campaign).start),
    archivedTasksDisplay: MOCK_ARCHIVED_TASKS,
  };
}
