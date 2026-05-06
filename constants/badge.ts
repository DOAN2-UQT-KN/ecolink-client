export const BADGE_CATEGORY_LABEL = {
  REPORT: 'Report',
  CAMPAIGN: 'Campaign',
  CONTRIBUTION: 'Contribution',
  RANK: 'Ranking',
} as const;

export const BADGE_SCOPE_LABEL = {
  LIFETIME: 'Lifetime',
  SEASON: 'Season',
} as const;

export type BadgeCategory = keyof typeof BADGE_CATEGORY_LABEL;
export type BadgeScope = keyof typeof BADGE_SCOPE_LABEL;

export const BADGE_CATEGORY_KEYS = Object.keys(BADGE_CATEGORY_LABEL) as BadgeCategory[];
export const BADGE_SCOPE_KEYS = Object.keys(BADGE_SCOPE_LABEL) as BadgeScope[];
