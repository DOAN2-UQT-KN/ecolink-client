"use client";

import {
  createContext,
  memo,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from "react";
import { FormProvider, useForm, UseFormReturn } from "react-hook-form";
import { useRouter } from "next/navigation";

import { IIncident } from "@/apis/incident/models/incident";
import { queryClient } from "@/libs/queryClient";

import {
  CampaignFormValues,
  DEFAULT_CAMPAIGN_FORM_VALUES,
  transformToApiData,
} from "../_services/campaign.service";
import { useCreateCampaign } from "@/apis/campaign/createCampaign";
import { uploadToCloudinary } from "@/app/(pages)/(main)/incidents/create/_services/upload.service";

interface CampaignContextType {
  form: UseFormReturn<CampaignFormValues>;
  onSubmit: (data: CampaignFormValues) => void;
  isPending: boolean;
  isUploading: boolean;
  selectedReports: IIncident[];
  setSelectedReports: (reports: IIncident[]) => void;
}

export const CampaignContext = createContext<CampaignContextType | undefined>(
  undefined,
);

export const CampaignProvider = memo(function CampaignProvider({
  children,
  organizationId,
}: {
  children: ReactNode;
  organizationId?: string;
}) {
  const router = useRouter();

  const [isUploading, setIsUploading] = useState(false);
  const [selectedReports, setSelectedReportsState] = useState<IIncident[]>([]);

  const form = useForm<CampaignFormValues>({
    defaultValues: {
      ...DEFAULT_CAMPAIGN_FORM_VALUES,
      organization_id: organizationId ?? "",
    },
  });

  useEffect(() => {
    if (!organizationId) return;
    form.setValue("organization_id", organizationId, { shouldDirty: false });
  }, [form, organizationId]);

  const setSelectedReports = useCallback(
    (reports: IIncident[]) => {
      setSelectedReportsState(reports);
      form.setValue("selectedReports", reports, { shouldDirty: true });
    },
    [form],
  );

  const { mutate: createCampaign, isPending } = useCreateCampaign({
    onSuccess: () => {
      form.reset(DEFAULT_CAMPAIGN_FORM_VALUES);
      setSelectedReportsState([]);
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      router.push(`/organizations/${organizationId}`);
    },
  });

  const onSubmit = useCallback(
    async (data: CampaignFormValues) => {
      const targetOrganizationId = data.organization_id || organizationId;
      if (!targetOrganizationId) return;

      try {
        setIsUploading(true);
        const bannerUrl = data.banner
          ? await uploadToCloudinary(data.banner)
          : undefined;
        const payload = transformToApiData({
          ...data,
          banner: bannerUrl,
          organization_id: targetOrganizationId,
        });
        createCampaign(payload);
      } finally {
        setIsUploading(false);
      }
    },
    [createCampaign, organizationId],
  );

  const contextValue = useMemo(
    () => ({
      form,
      onSubmit,
      isPending,
      isUploading,
      selectedReports,
      setSelectedReports,
    }),
    [form, isPending, isUploading, onSubmit, selectedReports, setSelectedReports],
  );

  return (
    <CampaignContext.Provider value={contextValue}>
      <FormProvider {...form}>{children}</FormProvider>
    </CampaignContext.Provider>
  );
});
