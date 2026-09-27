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

/** Where an owner change (add / remove) stands. */
export const OWNER_CHANGE_STATUS_TAG: Record<string, { type: STATUS; label: string }> = {
  AWAITING_OWNER_CONFIRMATION: { type: STATUS.WAITING_CONFIRMED, label: 'Waiting for answers' },
  APPROVED: { type: STATUS.APPROVED, label: 'Applied' },
  REJECTED: { type: STATUS.REJECTED, label: 'Rejected' },
  WITHDRAWN: { type: STATUS.CANCELED, label: 'Cancelled' },
};

/** One co-owner's answer on an owner change. */
export const OWNER_APPROVAL_STATUS_TAG: Record<string, { type: STATUS; label: string }> = {
  PENDING: { type: STATUS.PENDING, label: 'Waiting for approval' },
  APPROVED: { type: STATUS.APPROVED, label: 'Approved' },
  REJECTED: { type: STATUS.REJECTED, label: 'Rejected' },
  EXPIRED: { type: STATUS.CANCELED, label: 'Expired' },
};

export const OWNER_CHANGE_TYPE_LABEL: Record<string, string> = {
  ADD_OWNER: 'Add owners',
  REMOVE_OWNER: 'Remove owner',
};
