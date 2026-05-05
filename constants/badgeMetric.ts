export const BADGE_METRIC_LABEL = {
  CRP: 'Citizen Ranking Points',
  VRP: 'Volunteer Ranking Points',
  RANK: 'Ranking (Top N)',
} as const;

export type BadgeMetricUiKey = keyof typeof BADGE_METRIC_LABEL;

export const BADGE_METRIC_UI_KEYS: BadgeMetricUiKey[] = ["CRP", "VRP", "RANK"];
