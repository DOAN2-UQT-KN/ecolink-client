export type PayoutMetric = 'CRP' | 'VRP' | 'ORG_AGGREGATE';

export const PAYOUT_METRIC_OPTIONS: { value: PayoutMetric; label: string }[] = [
  { value: 'CRP', label: 'Citizen Reputation Points' },
  { value: 'VRP', label: 'Volunteer Reputation Points' },
  { value: 'ORG_AGGREGATE', label: 'Organization Aggregate Points' },
];

