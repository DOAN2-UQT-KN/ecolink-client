export const BADGE_CATEGORY_LABEL = {
  REPORT: 'Report',
  CAMPAIGN: 'Campaign',
  CONTRIBUTION: 'Contribution',
  RANK: 'Ranking',
} as const;

export const BADGE_METRIC_LABEL = {
  CRP: 'Citizen Ranking Points',
  VRP: 'Volunteer Ranking Points',
  REPORT_UPVOTES: 'Report Upvotes',
  REPORT_COUNT: 'Number of Reports',
  CAMPAIGN_COMPLETED: 'Campaigns Completed',
} as const;

export const BADGE_RULE_TYPE_LABEL = {
  THRESHOLD: 'Threshold',
  RANK: 'Top Ranking',
} as const;

export type BadgeCategory = keyof typeof BADGE_CATEGORY_LABEL;
export type BadgeMetric = keyof typeof BADGE_METRIC_LABEL;
export type BadgeRuleType = keyof typeof BADGE_RULE_TYPE_LABEL;

export const BADGE_CATEGORY_KEYS = Object.keys(BADGE_CATEGORY_LABEL) as BadgeCategory[];
export const BADGE_RULE_TYPE_KEYS = Object.keys(BADGE_RULE_TYPE_LABEL) as BadgeRuleType[];

export const BADGE_METRICS_BY_CATEGORY: Record<BadgeCategory, BadgeMetric[]> = {
  REPORT: ['REPORT_UPVOTES', 'REPORT_COUNT'],
  CAMPAIGN: ['CAMPAIGN_COMPLETED'],
  CONTRIBUTION: ['CRP', 'VRP'],
  RANK: ['CRP', 'VRP'],
};
