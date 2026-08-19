import type { IGetCampaignsRequest } from "@/apis/campaign/models/getCampaigns";
import { STATUS } from "@/constants/status";

export type CampaignSearchViewMode = "explore" | "mine";

export const DEFAULT_CAMPAIGN_SEARCH_STATUSES = [
  STATUS.ACTIVE,
  STATUS.INREVIEW,
  STATUS.WAITING_CONFIRMED,
  STATUS.COMPLETED,
] as const;

export type CampaignSearchFilters = Pick<IGetCampaignsRequest, "search"> & {
  statuses: number[];
  greenPointsFrom?: number;
  greenPointsTo?: number;
};

export const CAMPAIGN_PAGE_SIZE = 12;
export const CAMPAIGN_SEARCH_DEBOUNCE_MS = 500;

export const CAMPAIGN_STATUS_OPTIONS = [
  { label: "Pending", value: STATUS.PENDING },
  { label: "Active", value: STATUS.ACTIVE },
  { label: "In Review", value: STATUS.INREVIEW },
  { label: "Waiting Confirmed", value: STATUS.WAITING_CONFIRMED },
  { label: "Completed", value: STATUS.COMPLETED },
] as const;

export function parseViewMode(tabValue: string | undefined): CampaignSearchViewMode {
  return tabValue === "mine" ? "mine" : "explore";
}

export function parseStatuses(
  value: number[] | string | undefined,
): number[] | undefined {
  if (value == null) return undefined;

  const numbers = Array.isArray(value)
    ? value
    : value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .map((item) => Number(item));

  if (numbers.length === 0) return undefined;

  const allowedStatus = CAMPAIGN_STATUS_OPTIONS.map((option) => option.value);
  const filtered = numbers.filter(
    (status) =>
      Number.isInteger(status) &&
      allowedStatus.includes(status as (typeof allowedStatus)[number]),
  );

  if (filtered.length === 0) return undefined;
  return [...new Set(filtered)];
}

export function serializeStatuses(statuses: number[] | undefined): string | undefined {
  if (!statuses || statuses.length === 0) return undefined;
  return statuses.join(",");
}

export function isDefaultCampaignStatuses(statuses: number[] | undefined): boolean {
  if (!statuses || statuses.length !== DEFAULT_CAMPAIGN_SEARCH_STATUSES.length) {
    return false;
  }

  return DEFAULT_CAMPAIGN_SEARCH_STATUSES.every((status) => statuses.includes(status));
}

export function parseGreenPoints(value: string | undefined): number | undefined {
  if (!value) return undefined;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;

  return Math.floor(parsed);
}

export function areCampaignSearchFiltersEqual(
  a: CampaignSearchFilters,
  b: CampaignSearchFilters,
): boolean {
  return (
    a.search === b.search &&
    a.greenPointsFrom === b.greenPointsFrom &&
    a.greenPointsTo === b.greenPointsTo &&
    a.statuses.length === b.statuses.length &&
    a.statuses.every((status, index) => status === b.statuses[index])
  );
}

export function buildCampaignSearchFilters(initial: {
  search?: string;
  statuses?: number[] | string;
  status?: string;
  greenPointsFrom?: string;
  greenPointsTo?: string;
}): CampaignSearchFilters {
  const parsedStatuses =
    parseStatuses(initial.statuses) ??
    parseStatuses(initial.status) ??
    [...DEFAULT_CAMPAIGN_SEARCH_STATUSES];

  return {
    search: initial.search ?? "",
    statuses: parsedStatuses,
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
