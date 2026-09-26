import type {
  ApplicationStatus,
  OwnerCandidateStatus,
} from '@/apis/organization-application/models/application';
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
  AWAITING_OWNER_CONFIRMATION: {
    type: STATUS.WAITING_CONFIRMED,
    label: 'Waiting for owners to confirm',
  },
  PENDING_REVIEW: { type: STATUS.NEW, label: 'Waiting for review' },
  NEEDS_REVISION: { type: STATUS.RETURNED, label: 'Changes needed' },
  APPROVED: { type: STATUS.APPROVED, label: 'Approved' },
  REJECTED: { type: STATUS.REJECTED, label: 'Not approved' },
  WITHDRAWN: { type: STATUS.CANCELED, label: 'Withdrawn' },
};

/** Where one owner stands on their confirmation email. */
export const OWNER_CANDIDATE_STATUS_TAG: Record<
  OwnerCandidateStatus,
  { type: STATUS; label: string }
> = {
  PENDING: { type: STATUS.PENDING, label: 'Waiting for confirmation' },
  CONFIRMED: { type: STATUS.CONFIRMED, label: 'Confirmed' },
  DECLINED: { type: STATUS.REJECTED, label: 'Declined' },
  EXPIRED: { type: STATUS.CANCELED, label: 'Expired' },
};
