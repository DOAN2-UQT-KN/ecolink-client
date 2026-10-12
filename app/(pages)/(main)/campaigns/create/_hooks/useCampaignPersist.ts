import { useCallback, useRef, useState } from 'react';
import type { Path, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useRouter } from '@/libs/router';

import { queryClient } from '@/libs/queryClient';
import type { QueryError } from '@/hooks/reactQuery';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';
import { useCreateCampaign } from '@/apis/campaign/createCampaign';
import { useUpdateCampaign } from '@/apis/campaign/updateCampaign';
import { useSubmitCampaign } from '@/apis/campaign/submitCampaign';
import type { ICampaign } from '@/apis/campaign/models/campaign';
import type { ICampaignValidationIssue } from '@/apis/campaign/models/lifecycle';
import { CAMPAIGN_ISSUE_MESSAGES, isApprovedEdit } from '@/constants/campaignLifecycle';
import { uploadToCloudinary } from '@/libs/cloudinary';

import { majorFieldsFingerprint, transformToApiData } from '../_services/campaign.service';
import { CampaignFormValues, fitSchedule } from '../_services/campaignForm.service';
import { issueFieldToFormName } from '../_services/campaignIssues.service';
import {
  CAMPAIGN_STEPS,
  STEP_FIELDS,
  errorPaths,
  stepOfField,
  type CampaignStep,
} from '../_services/campaignSteps.service';
import { refreshCampaign } from '../../_services/campaignCache.service';

type CampaignApiError = QueryError & {
  details?: ICampaignValidationIssue[];
  report_ids?: string[];
};

const toastReReview = (t: TFunction) =>
  showMessage({
    type: MessageType.Toast,
    level: MessageLevel.Success,
    title: t('Changes saved. The campaign is waiting for admin review again.'),
  });

/**
 * Saving the wizard: creates the draft, then updates it; submits it for review; maps the server's
 * problems onto the form; tells whether an approved campaign's edit needs a new review.
 */
export function useCampaignPersist({
  form,
  campaign,
  currentUserId,
  step,
  stepIndex,
  showStep,
}: {
  form: UseFormReturn<CampaignFormValues>;
  campaign?: ICampaign;
  currentUserId: string;
  step: CampaignStep;
  stepIndex: number;
  showStep: (index: number) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();

  const [isUploading, setIsUploading] = useState(false);
  /** The last update sent an approved campaign back for review (spec 3.5). */
  const reReviewRef = useRef(false);
  const [campaignId, setCampaignId] = useState<string | undefined>(campaign?.id);
  const [saved, setSaved] = useState<ICampaign | undefined>(campaign);
  const [issues, setIssues] = useState<ICampaignValidationIssue[]>([]);
  const [takenReportIds, setTakenReportIds] = useState<string[]>([]);

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
          // cast: server field names are mapped to form paths by issueFieldToFormName.
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
        reReviewRef.current = Boolean(res.data?.campaign?.re_review);
        return campaignId;
      }
      const res = await createAsync(payload);
      const id = res.data?.campaign?.id;
      if (res.data?.campaign) setSaved(res.data.campaign);
      // Later saves update this draft instead of creating another one.
      if (id) setCampaignId(id);
      return id;
    } catch (error) {
      // cast: usePost rejects with the API error body, not an Error.
      applyServerErrors(error as CampaignApiError);
      return undefined;
    }
  }, [applyServerErrors, campaignId, createAsync, currentUserId, form, showStep, updateAsync]);

  const approvedEdit = isApprovedEdit(saved ?? campaign);
  const [savedMajor, setSavedMajor] = useState(() =>
    majorFieldsFingerprint(form.getValues(), currentUserId),
  );
  const hasMajorChange = useCallback(
    () => majorFieldsFingerprint(form.getValues(), currentUserId) !== savedMajor,
    [currentUserId, form, savedMajor],
  );

  /**
   * Saves, then moves the "important part" baseline. Returns the id and whether the save sent an
   * approved campaign back for review (told with a toast either way it is saved).
   */
  const saveAndTrack = useCallback(async (): Promise<string | undefined> => {
    const id = await persist();
    if (!id) return undefined;
    setSavedMajor(majorFieldsFingerprint(form.getValues(), currentUserId));
    queryClient.invalidateQueries({ queryKey: ['my-campaigns'] });
    // Not setQueryData: the update response lacks the viewer/locale fields GET /campaigns/:id adds.
    refreshCampaign(id);
    return id;
  }, [currentUserId, form, persist]);

  const saveDraft = useCallback(async () => {
    const id = await saveAndTrack();
    if (!id) return;
    if (reReviewRef.current) {
      toastReReview(t);
      return;
    }
    showMessage({
      type: MessageType.Toast,
      level: MessageLevel.Success,
      title: approvedEdit ? t('Changes saved') : t('Draft saved'),
    });
  }, [approvedEdit, saveAndTrack, t]);

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
      refreshCampaign(id);
      router.push('/campaigns/me');
    } catch (error) {
      // cast: usePost rejects with the API error body, not an Error.
      applyServerErrors(error as CampaignApiError);
    }
  }, [applyServerErrors, form, persist, router, showStep, submitAsync]);

  /** Validates this step, saves the draft quietly, then moves on. */
  const next = useCallback(async () => {
    if (!(await form.trigger(STEP_FIELDS[step]))) return;
    const id = await saveAndTrack();
    if (!id) return;
    if (reReviewRef.current) toastReReview(t);
    showStep(Math.min(stepIndex + 1, CAMPAIGN_STEPS.length - 1));
  }, [form, saveAndTrack, showStep, step, stepIndex, t]);

  return {
    saved,
    approvedEdit,
    hasMajorChange,
    isSaving: isCreating || isUpdating,
    isSubmitting,
    isUploading,
    issues,
    takenReportIds,
    saveDraft,
    submitForReview,
    next,
  };
}
