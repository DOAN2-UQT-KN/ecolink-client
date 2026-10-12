import type { Path } from 'react-hook-form';

import type { ICampaignValidationIssue } from '@/apis/campaign/models/lifecycle';
import type { CampaignFormValues } from './campaignForm.service';
import { issueFieldToFormName } from './campaignIssues.service';

/** Wizard steps, in order. The first Continue creates the draft, so step 1 holds its essentials. */
export const CAMPAIGN_STEPS = ['general', 'schedule', 'meeting_points', 'shifts', 'review'] as const;
export type CampaignStep = (typeof CAMPAIGN_STEPS)[number];

/** Fields validated when leaving each step. */
export const STEP_FIELDS: Record<CampaignStep, Path<CampaignFormValues>[]> = {
  general: ['title', 'difficulty', 'description', 'banner'],
  schedule: ['days', 'contact_name', 'contact_phone', 'min_age'],
  meeting_points: ['meeting_points'],
  shifts: ['schedule', 'min_volunteers_reason'],
  review: [],
};

/** Which step a form field belongs to; anything unknown lives with the meeting points. */
export function stepOfField(name: string): number {
  const index = CAMPAIGN_STEPS.findIndex((step) =>
    STEP_FIELDS[step].some((field) => name === field || name.startsWith(`${field}.`)),
  );
  return index === -1 ? CAMPAIGN_STEPS.indexOf('meeting_points') : index;
}

/** Dotted paths of every field that currently has an error. */
export function errorPaths(errors: unknown, prefix = ''): string[] {
  if (!errors || typeof errors !== 'object') return [];
  // cast: react-hook-form error trees are indexed by field name at runtime.
  const record = errors as Record<string, unknown>;
  if ('message' in record || 'type' in record) return prefix ? [prefix] : [];
  return Object.entries(record).flatMap(([key, value]) =>
    errorPaths(value, prefix ? `${prefix}.${key}` : key),
  );
}

/** Steps holding a problem from the last submit. */
export function errorStepIdsOf(
  issues: ICampaignValidationIssue[],
  takenReportIds: string[],
): Set<string> {
  const ids = new Set<string>();
  for (const issue of issues) {
    ids.add(CAMPAIGN_STEPS[stepOfField(issueFieldToFormName(issue.field, issue.code) ?? issue.field)]);
  }
  if (takenReportIds.length > 0) ids.add('meeting_points');
  return ids;
}
