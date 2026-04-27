import type { IGetCampaignsRequest } from "@/apis/campaign/models/getCampaigns";
import { STATUS } from "@/constants/status";

export type CampaignSearchViewMode = "explore" | "mine";

export type CampaignSearchFilters = Pick<IGetCampaignsRequest, "search" | "status"> & {
  greenPointsFrom?: number;
  greenPointsTo?: number;
};

export const CAMPAIGN_PAGE_SIZE = 12;
export const CAMPAIGN_SEARCH_DEBOUNCE_MS = 500;

export const CAMPAIGN_STATUS_OPTIONS = [
  { label: "Pending", value: STATUS.PENDING },
  { label: "Active", value: STATUS.ACTIVE },
  { label: "Completed", value: STATUS.COMPLETED },
] as const;

export function parseViewMode(tabValue: string | undefined): CampaignSearchViewMode {
  return tabValue === "mine" ? "mine" : "explore";
}

export function parseStatus(value: string | undefined): number | undefined {
  if (!value) return undefined;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;

  const allowedStatus = CAMPAIGN_STATUS_OPTIONS.map((option) => option.value);
  return allowedStatus.includes(parsed as (typeof allowedStatus)[number]) ? parsed : undefined;
}

export function parseGreenPoints(value: string | undefined): number | undefined {
  if (!value) return undefined;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;

  return Math.floor(parsed);
}

export function buildCampaignSearchFilters(initial: {
  search?: string;
  status?: string;
  greenPointsFrom?: string;
  greenPointsTo?: string;
}): CampaignSearchFilters {
  return {
    search: initial.search ?? "",
    status: parseStatus(initial.status),
    greenPointsFrom: parseGreenPoints(initial.greenPointsFrom),
    greenPointsTo: parseGreenPoints(initial.greenPointsTo),
  };
}

export function applyGreenPointsRange<T extends { green_points?: number }>(
  campaigns: T[],
  from?: number,
  to?: number,
): T[] {
  return campaigns.filter((campaign) => {
    const points = campaign.green_points ?? 0;

    if (from !== undefined && points < from) {
      return false;
    }

    if (to !== undefined && points > to) {
      return false;
    }

    return true;
  });
}
