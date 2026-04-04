"use client";

import React, { createContext, ReactNode } from "react";
import { useForm, FormProvider, UseFormReturn } from "react-hook-form";
import { useCreateReport } from "@/apis/incident/createReport";
import {
  IncidentFormValues,
  transformToApiData,
} from "../_services/incident.service";

interface IncidentContextType {
  form: UseFormReturn<IncidentFormValues>;
  onSubmit: (data: IncidentFormValues) => void;
  isPending: boolean;
}

export const IncidentContext = createContext<IncidentContextType | undefined>(
  undefined,
);

export const IncidentProvider = ({ children }: { children: ReactNode }) => {
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
      // router.push("/incidents/me");
    },
  });

  const onSubmit = (data: IncidentFormValues) => {
    const apiData = transformToApiData(data);
    createIncident(apiData);
  };

  return (
    <IncidentContext.Provider value={{ form, onSubmit, isPending }}>
      <FormProvider {...form}>{children}</FormProvider>
    </IncidentContext.Provider>
  );
};
