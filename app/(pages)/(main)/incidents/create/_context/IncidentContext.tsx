'use client';

import React, { createContext, ReactNode, useCallback, useMemo } from 'react';
import { useForm, FormProvider, UseFormReturn } from 'react-hook-form';
import { useCreateReport } from '@/apis/incident/createReport';
import { IncidentFormValues, transformToApiData } from '../_services/incident.service';
import { uploadMultipleImages } from '../_services/upload.service';
import { useRouter } from 'next/navigation';
import { queryClient } from '@/libs/queryClient';

interface IncidentContextType {
  form: UseFormReturn<IncidentFormValues>;
  onSubmit: (data: IncidentFormValues) => void;
  isPending: boolean;
  isUploading: boolean;
}

export const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export const IncidentProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  const [isUploading, setIsUploading] = React.useState(false);

  const form = useForm<IncidentFormValues>({
    defaultValues: {
      title: '',
      description: '',
      latitude: undefined,
      longitude: undefined,
      detailAddress: '',
      wasteTypes: [],
      condition: '',
      pollutionLevels: [],
      size: '',
      imageStrings: [],
    },
  });

  const { mutate: createIncident, isPending } = useCreateReport({
    onSuccess: () => {
      form.reset();
      router.push('/incidents/me');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['all-reports'] });
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
    },
  });

  const onSubmit = useCallback(
    async (data: IncidentFormValues) => {
      try {
        setIsUploading(true);
        // Step 1: Upload images to Cloudinary
        const imageUrls = await uploadMultipleImages(data.imageStrings);

        // Step 2: Prepare API data with URLs
        const apiData = transformToApiData({
          ...data,
          imageStrings: imageUrls,
        });

        // Step 3: Create Incident
        createIncident(apiData);
      } catch (error) {
        console.error('Submission failed:', error);
      } finally {
        setIsUploading(false);
      }
    },
    [createIncident],
  );

  const contextValue = useMemo(
    () => ({ form, onSubmit, isPending, isUploading }),
    [form, onSubmit, isPending, isUploading],
  );

  return (
    <IncidentContext.Provider value={contextValue}>
      <FormProvider {...form}>{children}</FormProvider>
    </IncidentContext.Provider>
  );
};
