import { createContext, memo, ReactNode, useCallback, useMemo, useState } from 'react';
import { FormProvider, Path, useForm, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useRouter } from '@/libs/router';

import { queryClient } from '@/libs/queryClient';
import type { QueryError } from '@/hooks/reactQuery';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';

import {
  CampaignFormValues,
  DEFAULT_CAMPAIGN_FORM_VALUES,
  campaignToFormValues,
  emptyShift,
  fitSchedule,
  issueFieldToFormName,
  transformToApiData,
} from '../_services/campaign.service';
import { useCreateCampaign } from '@/apis/campaign/createCampaign';
import { useUpdateCampaign } from '@/apis/campaign/updateCampaign';
import { useSubmitCampaign } from '@/apis/campaign/submitCampaign';
import { useGetCreateEligibility } from '@/apis/campaign/getCreateEligibility';
import type { ICampaign } from '@/apis/campaign/models/campaign';
import type {
  ICampaignCreateEligibility,
  ICampaignValidationIssue,
} from '@/apis/campaign/models/lifecycle';
import { CAMPAIGN_ISSUE_MESSAGES } from '@/constants/campaignLifecycle';
import { uploadToCloudinary } from '@/app/(pages)/(main)/incidents/create/_services/upload.service';
import useAuthStore from '@/stores/useAuthStore';

/** Wizard steps, in order. The first Continue creates the draft, so step 1 holds its essentials. */
export const CAMPAIGN_STEPS = ['general', 'schedule', 'meeting_points', 'shifts', 'review'] as const;
export type CampaignStep = (typeof CAMPAIGN_STEPS)[number];

/** Fields validated when leaving each step. */
const STEP_FIELDS: Record<CampaignStep, Path<CampaignFormValues>[]> = {
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
function errorPaths(errors: unknown, prefix = ''): string[] {
  if (!errors || typeof errors !== 'object') return [];
  const record = errors as Record<string, unknown>;
  if ('message' in record || 'type' in record) return prefix ? [prefix] : [];
  return Object.entries(record).flatMap(([key, value]) =>
    errorPaths(value, prefix ? `${prefix}.${key}` : key),
  );
}

type CampaignApiError = QueryError & {
  details?: ICampaignValidationIssue[];
  report_ids?: string[];
};

/** The organization the campaign belongs to; fixed, never picked in the form. */
export interface CampaignOrganization {
  id: string;
  name: string;
  logo_url?: string | null;
}

interface CampaignContextType {
  form: UseFormReturn<CampaignFormValues>;
  organization?: CampaignOrganization;
  /** Present when editing an existing campaign. */
  campaign?: ICampaign;
  saveDraft: () => Promise<void>;
  submitForReview: () => Promise<void>;
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
  const { t } = useTranslation();
  const router = useRouter();

  const [isUploading, setIsUploading] = useState(false);
  const [campaignId, setCampaignId] = useState<string | undefined>(campaign?.id);
  const [saved, setSaved] = useState<ICampaign | undefined>(campaign);
  const currentUserId = useAuthStore((s) => s.user?.id) ?? '';
  const [issues, setIssues] = useState<ICampaignValidationIssue[]>([]);
  const [takenReportIds, setTakenReportIds] = useState<string[]>([]);
  const [stepIndex, setStepIndex] = useState(() =>
    initialStep && CAMPAIGN_STEPS.includes(initialStep) ? CAMPAIGN_STEPS.indexOf(initialStep) : 0,
  );
  // An existing campaign is complete enough to open any step.
  const [maxVisitedIndex, setMaxVisitedIndex] = useState(
    campaign ? CAMPAIGN_STEPS.length - 1 : 0,
  );
  const step = CAMPAIGN_STEPS[stepIndex];

  const showStep = useCallback((index: number) => {
    setStepIndex(index);
    setMaxVisitedIndex((prev) => Math.max(prev, index));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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

  const setSchedule = useCallback(
    (update: (grid: CampaignFormValues['schedule']) => CampaignFormValues['schedule']) => {
      const values = form.getValues();
      const grid = fitSchedule(
        values.schedule,
        values.days.length,
        values.meeting_points.length,
        currentUserId,
      );
      form.setValue('schedule', update(grid), { shouldDirty: true });
    },
    [currentUserId, form],
  );
  // Each runs after the days / meeting points list already changed.
  // Adding a day or a point: fitting the grid pads the new row / column with empty shifts.
  const addScheduleRow = useCallback(() => setSchedule((grid) => grid), [setSchedule]);
  const removeScheduleRow = useCallback(
    (dayIndex: number) => {
      const values = form.getValues();
      const grid = [...(values.schedule ?? [])];
      grid.splice(dayIndex, 1);
      form.setValue(
        'schedule',
        fitSchedule(grid, values.days.length, values.meeting_points.length, currentUserId),
        { shouldDirty: true },
      );
    },
    [currentUserId, form],
  );
  const addScheduleColumn = useCallback(() => setSchedule((grid) => grid), [setSchedule]);
  const removeScheduleColumn = useCallback(
    (pointIndex: number) => {
      const values = form.getValues();
      const grid = (values.schedule ?? []).map((row) => {
        const next = [...row];
        next.splice(pointIndex, 1);
        return next;
      });
      form.setValue(
        'schedule',
        fitSchedule(grid, values.days.length, values.meeting_points.length, currentUserId),
        { shouldDirty: true },
      );
    },
    [currentUserId, form],
  );

  const selectedOrganizationId = form.watch('organization_id');
  const { data: eligibilityData } = useGetCreateEligibility(selectedOrganizationId || undefined);
  const eligibility = eligibilityData?.data?.eligibility;

  const { mutateAsync: createAsync, isPending: isCreating } = useCreateCampaign({
    messageSuccess: undefined,
  });
  const { mutateAsync: updateAsync, isPending: isUpdating } = useUpdateCampaign({
    messageSuccess: undefined,
  });
  const { mutateAsync: submitAsync, isPending: isSubmitting } = useSubmitCampaign();

  const applyServerErrors = useCallback(
    (error: CampaignApiError) => {
      // Server messages embed ids and numbers; show the translated sentence for the code.
      const details = (error.details ?? []).map((issue) => ({
        ...issue,
        message: CAMPAIGN_ISSUE_MESSAGES[issue.code] ?? issue.message,
      }));
      setIssues(details);
      setTakenReportIds(error.report_ids ?? []);
      let firstStep: number | null = error.report_ids?.length
        ? CAMPAIGN_STEPS.indexOf('meeting_points')
        : null;
      for (const issue of details) {
        const name = issueFieldToFormName(issue.field, issue.code);
        if (name) {
          form.setError(name as Path<CampaignFormValues>, {
            type: 'server',
            message: t(issue.message),
          });
        }
        const at = stepOfField(name ?? issue.field);
        firstStep = firstStep == null ? at : Math.min(firstStep, at);
      }
      if (firstStep != null) showStep(firstStep);
    },
    [form, showStep, t],
  );

  /** Uploads a new banner, then creates or updates the campaign. Returns its id. */
  const persist = useCallback(async (): Promise<string | undefined> => {
    // A draft needs at least a title (step 1).
    if (!(await form.trigger(['title']))) {
      showStep(0);
      return undefined;
    }
    const data = form.getValues();
    form.clearErrors();
    setIssues([]);
    setTakenReportIds([]);

    setIsUploading(true);
    let bannerUrl: string | undefined;
    try {
      bannerUrl =
        data.banner && typeof data.banner !== 'string'
          ? await uploadToCloudinary(data.banner)
          : (data.banner as string | undefined);
    } finally {
      setIsUploading(false);
    }
    if (bannerUrl && typeof data.banner !== 'string') {
      form.setValue('banner', bannerUrl);
    }
    const payload = transformToApiData({
      ...data,
      banner: bannerUrl,
      schedule: fitSchedule(
        data.schedule,
        data.days.length,
        data.meeting_points.length,
        currentUserId,
      ),
    });

    try {
      if (campaignId) {
        const { organization_id: _org, ...rest } = payload;
        void _org;
        const res = await updateAsync({ id: campaignId, data: rest });
        if (res.data?.campaign) setSaved(res.data.campaign);
        return campaignId;
      }
      const res = await createAsync(payload);
      const id = res.data?.campaign?.id;
      if (res.data?.campaign) setSaved(res.data.campaign);
      // Later saves update this draft instead of creating another one.
      if (id) setCampaignId(id);
      return id;
    } catch (error) {
      applyServerErrors(error as CampaignApiError);
      return undefined;
    }
  }, [applyServerErrors, campaignId, createAsync, currentUserId, form, showStep, updateAsync]);

  const saveDraft = useCallback(async () => {
    const id = await persist();
    if (!id) return;
    queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
    queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    showMessage({
      type: MessageType.Toast,
      level: MessageLevel.Success,
      title: t('Draft saved'),
    });
  }, [persist, t]);

  const submitForReview = useCallback(async () => {
    // Same rules as the server, checked here first for quick feedback.
    if (!(await form.trigger())) {
      const failing = errorPaths(form.formState.errors).map(stepOfField);
      if (failing.length > 0) showStep(Math.min(...failing));
      return;
    }
    const id = await persist();
    if (!id) return;
    try {
      await submitAsync(id);
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      router.push('/campaigns/me');
    } catch (error) {
      applyServerErrors(error as CampaignApiError);
    }
  }, [applyServerErrors, form, persist, router, showStep, submitAsync]);

  /** Validates this step, saves the draft quietly, then moves on. */
  const next = useCallback(async () => {
    if (!(await form.trigger(STEP_FIELDS[step]))) return;
    const id = await persist();
    if (!id) return;
    queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
    showStep(Math.min(stepIndex + 1, CAMPAIGN_STEPS.length - 1));
  }, [form, persist, showStep, step, stepIndex]);

  const back = useCallback(() => {
    if (stepIndex > 0) showStep(stepIndex - 1);
  }, [showStep, stepIndex]);

  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index <= maxVisitedIndex) showStep(index);
    },
    [maxVisitedIndex, showStep],
  );

  const errorStepIds = useMemo(() => {
    const ids = new Set<string>();
    for (const issue of issues) {
      ids.add(CAMPAIGN_STEPS[stepOfField(issueFieldToFormName(issue.field, issue.code) ?? issue.field)]);
    }
    if (takenReportIds.length > 0) ids.add('meeting_points');
    return ids;
  }, [issues, takenReportIds]);

  const organization = useMemo<CampaignOrganization | undefined>(
    () =>
      organizationProp ??
      (campaign?.organization
        ? {
            id: campaign.organization_id ?? campaign.organization.id,
            name: campaign.organization.name,
            logo_url: campaign.organization.logo_url,
          }
        : undefined),
    [campaign, organizationProp],
  );

  const contextValue = useMemo(
    () => ({
      form,
      organization,
      campaign,
      saveDraft,
      submitForReview,
      isSaving: isCreating || isUpdating,
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
      isCreating,
      isSubmitting,
      isUpdating,
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
