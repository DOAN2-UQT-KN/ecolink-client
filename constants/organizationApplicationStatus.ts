import type { ApplicationStatus } from '@/apis/organization-application/models/application';
import { STATUS } from '@/constants/status';

/**
 * How an application status is drawn with `TagStatus`: `type` only picks the colour from the
 * shared palette, `label` keeps the application wording. Labels stay untranslated English —
 * call sites pass them through `t()`.
 */
export const APPLICATION_STATUS_TAG: Record<
  ApplicationStatus,
  { type: STATUS; label: string }
> = {
  DRAFT: { type: STATUS.DRAFT, label: 'Draft' },
  SUBMITTED: { type: STATUS.NEW, label: 'Waiting for review' },
  UNDER_REVIEW: { type: STATUS.IN_PROGRESS, label: 'Under review' },
  NEEDS_MORE_INFO: { type: STATUS.WAITING_CONFIRMED, label: 'More information needed' },
  APPROVED: { type: STATUS.APPROVED, label: 'Approved' },
  REJECTED: { type: STATUS.REJECTED, label: 'Not approved' },
  WITHDRAWN: { type: STATUS.CANCELED, label: 'Withdrawn' },
};
