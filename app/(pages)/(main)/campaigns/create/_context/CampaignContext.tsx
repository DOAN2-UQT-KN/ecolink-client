import { createContext, memo, ReactNode, useContext, useMemo } from 'react';
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form';

import {
  CampaignFormValues,
  DEFAULT_CAMPAIGN_FORM_VALUES,
  campaignToFormValues,
  emptyShift,
  organizationOfCampaign,
  type CampaignOrganization,
} from '../_services/campaign.service';
import { errorStepIdsOf, type CampaignStep } from '../_services/campaignSteps.service';
import { useGetCreateEligibility } from '@/apis/campaign/getCreateEligibility';
import type { ICampaign } from '@/apis/campaign/models/campaign';
import type {
  ICampaignCreateEligibility,
  ICampaignValidationIssue,
} from '@/apis/campaign/models/lifecycle';
import useAuthStore from '@/stores/useAuthStore';
import { useWizardSteps } from '../_hooks/useWizardSteps';
import { useCampaignSchedule } from '../_hooks/useCampaignSchedule';
import { useCampaignPersist } from '../_hooks/useCampaignPersist';

interface CampaignContextType {
  form: UseFormReturn<CampaignFormValues>;
  organization?: CampaignOrganization;
  /** Present when editing an existing campaign. */
  campaign?: ICampaign;
  saveDraft: () => Promise<void>;
  submitForReview: () => Promise<void>;
  /**
   * An approved campaign edited in place (spec 3.5): saved like a draft; an important change,
   * new hours of a day or shift included, sends it back for review.
   */
  approvedEdit: boolean;
  /** The campaign as last saved (the edit compares days with it). */
  savedCampaign?: ICampaign;
  /** Approved edit: the form changes an important field (location, days, waste points, …). */
  hasMajorChange: () => boolean;

  isSaving: boolean;
  isSubmitting: boolean;
  isUploading: boolean;
  eligibility?: ICampaignCreateEligibility;
  /** Problems the server found on the last submit, shown as a summary. */
  issues: ICampaignValidationIssue[];
  /** Waste points another campaign took first; the creator must remove them. */
  takenReportIds: string[];
  step: CampaignStep;
  stepIndex: number;
  /** Steps up to this index can be opened from the stepper. */
  maxVisitedIndex: number;
  /** Steps holding a problem from the last submit. */
  errorStepIds: Set<string>;
  next: () => Promise<void>;
  back: () => void;
  goToStep: (index: number) => void;
  /** Minimum volunteers per day the difficulty suggests, once the draft is saved; null = none. */
  suggestedMinPerDay: number | null;
  /**
   * Keep the day × meeting point grid in step with the days and meeting points lists: call
   * after adding or removing one of them.
   */
  addScheduleRow: () => void;
  removeScheduleRow: (dayIndex: number) => void;
  addScheduleColumn: () => void;
  removeScheduleColumn: (pointIndex: number) => void;
}

export const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};

export const CampaignProvider = memo(function CampaignProvider({
  children,
  organizationId,
  organization: organizationProp,
  campaign,
  initialStep,
}: {
  children: ReactNode;
  /** Organization of a new campaign (from the organization page). */
  organizationId?: string;
  organization?: CampaignOrganization;
  campaign?: ICampaign;
  /** Step to open first, e.g. from a section's "Edit" link on the campaign overview. */
  initialStep?: CampaignStep;
}) {
  const currentUserId = useAuthStore((s) => s.user?.id) ?? '';
  const { step, stepIndex, maxVisitedIndex, showStep, back, goToStep } = useWizardSteps(
    initialStep,
    Boolean(campaign),
  );

  const form = useForm<CampaignFormValues>({
    defaultValues: campaign
      ? campaignToFormValues(campaign)
      : {
          ...DEFAULT_CAMPAIGN_FORM_VALUES,
          organization_id: organizationId ?? '',
          // The creator leads the first shift unless someone else is picked.
          schedule: [[emptyShift(currentUserId)]],
        },
  });

  const { addScheduleRow, removeScheduleRow, addScheduleColumn, removeScheduleColumn } =
    useCampaignSchedule(form, currentUserId);

  const selectedOrganizationId = form.watch('organization_id');
  const { data: eligibilityData } = useGetCreateEligibility(selectedOrganizationId || undefined);
  const eligibility = eligibilityData?.data?.eligibility;

  const {
    saved,
    approvedEdit,
    hasMajorChange,
    isSaving,
    isSubmitting,
    isUploading,
    issues,
    takenReportIds,
    saveDraft,
    submitForReview,
    next,
  } = useCampaignPersist({ form, campaign, currentUserId, step, stepIndex, showStep });

  const errorStepIds = useMemo(
    () => errorStepIdsOf(issues, takenReportIds),
    [issues, takenReportIds],
  );

  const organization = useMemo(
    () => organizationProp ?? organizationOfCampaign(campaign),
    [campaign, organizationProp],
  );

  const contextValue = useMemo(
    () => ({
      form,
      organization,
      campaign,
      saveDraft,
      submitForReview,
      approvedEdit,
      savedCampaign: saved ?? campaign,
      hasMajorChange,
      isSaving,
      isSubmitting,
      isUploading,
      eligibility,
      issues,
      takenReportIds,
      step,
      stepIndex,
      maxVisitedIndex,
      errorStepIds,
      next,
      back,
      goToStep,
      suggestedMinPerDay: saved?.suggested_min_volunteers ?? null,
      addScheduleRow,
      removeScheduleRow,
      addScheduleColumn,
      removeScheduleColumn,
    }),
    [
      saved,
      approvedEdit,
      hasMajorChange,
      addScheduleRow,
      removeScheduleRow,
      addScheduleColumn,
      removeScheduleColumn,
      organization,
      back,
      errorStepIds,
      goToStep,
      maxVisitedIndex,
      next,
      step,
      stepIndex,
      campaign,
      eligibility,
      form,
      isSaving,
      isSubmitting,
      isUploading,
      issues,
      saveDraft,
      submitForReview,
      takenReportIds,
    ],
  );

  return (
    <CampaignContext.Provider value={contextValue}>
      <FormProvider {...form}>{children}</FormProvider>
    </CampaignContext.Provider>
  );
});
