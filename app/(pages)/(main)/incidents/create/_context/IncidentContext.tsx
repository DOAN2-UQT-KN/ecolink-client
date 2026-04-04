"use client";

import React, { createContext, ReactNode, useCallback, useMemo } from "react";
import { useForm, FormProvider, UseFormReturn } from "react-hook-form";
import { useCreateReport } from "@/apis/incident/createReport";
import {
  IncidentFormValues,
  transformToApiData,
} from "../_services/incident.service";
import { useRouter } from "next/navigation";

interface IncidentContextType {
  form: UseFormReturn<IncidentFormValues>;
  onSubmit: (data: IncidentFormValues) => void;
  isPending: boolean;
}

export const IncidentContext = createContext<IncidentContextType | undefined>(
  undefined,
);

export const IncidentProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  const form = useForm<IncidentFormValues>({
    defaultValues: {
      title: "",
      description: "",
      latitude: undefined,
      longitude: undefined,
      detailAddress: "",
      wasteTypes: [],
      condition: "",
      pollutionLevels: [],
      size: "",
      imageString: [],
    },
  });

  const { mutate: createIncident, isPending } = useCreateReport({
    onSuccess: () => {
      router.push("/incidents/me");
    },
  });

  const onSubmit = useCallback(
    (data: IncidentFormValues) => {
      const apiData = transformToApiData(data);
      createIncident(apiData);
    },
    [createIncident],
  );

  const contextValue = useMemo(() => ({ form, onSubmit, isPending }), [
    form,
    onSubmit,
    isPending,
  ]);

  return (
    <IncidentContext.Provider value={contextValue}>
      <FormProvider {...form}>{children}</FormProvider>
    </IncidentContext.Provider>
  );
};
