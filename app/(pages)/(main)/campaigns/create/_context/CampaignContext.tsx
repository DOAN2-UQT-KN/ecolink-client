import { createContext, memo, ReactNode, useEffect, useCallback, useMemo, useState } from 'react';
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

type CampaignApiError = QueryError & {
  details?: ICampaignValidationIssue[];
  report_ids?: string[];
};

interface CampaignContextType {
  form: UseFormReturn<CampaignFormValues>;
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
}

export const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export const CampaignProvider = memo(function CampaignProvider({
  children,
  organizationId,
  campaign,
}: {
  children: ReactNode;
  /** Pre-selected organization; applied once it resolves unless the user already picked one. */
  organizationId?: string;
  campaign?: ICampaign;
}) {
  const { t } = useTranslation();
  const router = useRouter();

  const [isUploading, setIsUploading] = useState(false);
  const [campaignId, setCampaignId] = useState<string | undefined>(campaign?.id);
  const [issues, setIssues] = useState<ICampaignValidationIssue[]>([]);
  const [takenReportIds, setTakenReportIds] = useState<string[]>([]);

  const form = useForm<CampaignFormValues>({
    defaultValues: campaign
      ? campaignToFormValues(campaign)
      : { ...DEFAULT_CAMPAIGN_FORM_VALUES, organization_id: organizationId ?? '' },
  });

  useEffect(() => {
    if (!organizationId || campaign) return;
    if (form.getValues('organization_id')) return;
    form.setValue('organization_id', organizationId, { shouldDirty: false });
  }, [campaign, form, organizationId]);

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
      for (const issue of details) {
        const name = issueFieldToFormName(issue.field);
        if (name) {
          form.setError(name as Path<CampaignFormValues>, {
            type: 'server',
            message: t(issue.message),
          });
        }
      }
    },
    [form, t],
  );

  /** Uploads a new banner, then creates or updates the campaign. Returns its id. */
  const persist = useCallback(async (): Promise<string | undefined> => {
    const data = form.getValues();
    if (!data.organization_id) {
      form.setError('organization_id', { message: t('Organization is required') });
      return undefined;
    }
    if (!data.title.trim()) {
      form.setError('title', { message: t('Title is required') });
      return undefined;
    }
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
    const payload = transformToApiData({ ...data, banner: bannerUrl });

    try {
      if (campaignId) {
        const { organization_id: _org, ...rest } = payload;
        void _org;
        await updateAsync({ id: campaignId, data: rest });
        return campaignId;
      }
      const res = await createAsync(payload);
      const id = res.data?.campaign?.id;
      // Later saves update this draft instead of creating another one.
      if (id) setCampaignId(id);
      return id;
    } catch (error) {
      applyServerErrors(error as CampaignApiError);
      return undefined;
    }
  }, [applyServerErrors, campaignId, createAsync, form, t, updateAsync]);

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
    if (!(await form.trigger())) return;
    const id = await persist();
    if (!id) return;
    try {
      await submitAsync(id);
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      router.push('/campaigns/me');
    } catch (error) {
      applyServerErrors(error as CampaignApiError);
    }
  }, [applyServerErrors, form, persist, router, submitAsync]);

  const contextValue = useMemo(
    () => ({
      form,
      campaign,
      saveDraft,
      submitForReview,
      isSaving: isCreating || isUpdating,
      isSubmitting,
      isUploading,
      eligibility,
      issues,
      takenReportIds,
    }),
    [
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
