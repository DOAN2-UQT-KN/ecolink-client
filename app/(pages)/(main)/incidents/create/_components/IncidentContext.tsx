"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useForm, FormProvider, UseFormReturn } from "react-hook-form";
import { useCreateReport } from "@/apis/incident/createReport";
import { ICreateReportRequest } from "@/apis/incident/models/createReport";

export interface IncidentFormValues {
  title: string;
  description: string;
  city: string;
  district: string;
  detailAddress: string;
  wasteTypes: string[];
  condition: string;
  pollutionLevels: string[];
  size: string;
  imageString: string[];
}

interface IncidentContextType {
  form: UseFormReturn<IncidentFormValues>;
  onSubmit: (data: IncidentFormValues) => void;
  isPending: boolean;
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export const IncidentProvider = ({ children }: { children: ReactNode }) => {
  const form = useForm<IncidentFormValues>({
    defaultValues: {
      title: "",
      description: "",
      city: "",
      district: "",
      detailAddress: "",
      wasteTypes: [],
      condition: "",
      pollutionLevels: [],
      size: "",
      imageString: [],
    },
  });

  const { mutate, isPending } = useCreateReport({});

  const onSubmit = (data: IncidentFormValues) => {
    const apiData: ICreateReportRequest = {
      title: data.title,
      description: data.description,
      wasteType: data.wasteTypes.join(", "),
      // severityLevel could be mapped if needed
    };
    mutate(apiData);
  };

  return (
    <IncidentContext.Provider value={{ form, onSubmit, isPending }}>
      <FormProvider {...form}>{children}</FormProvider>
    </IncidentContext.Provider>
  );
};

export const useIncidentContext = () => {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error("useIncidentContext must be used within an IncidentProvider");
  }
  return context;
};
