"use client";

import React, { createContext, ReactNode, useCallback, useMemo } from "react";
import { useForm, FormProvider, UseFormReturn } from "react-hook-form";
import { useCreateOrganization } from "@/apis/organization/createOrganization";
import {
  OrganizationFormValues,
  toCreateOrganizationRequest,
} from "../_services/organization.service";
import { uploadToCloudinary } from "../_services/upload.service";
import { useRouter } from "next/navigation";
import { queryClient } from "@/libs/queryClient";

interface OrganizationContextType {
  form: UseFormReturn<OrganizationFormValues>;
  onSubmit: (data: OrganizationFormValues) => void | Promise<void>;
  isPending: boolean;
  isUploading: boolean;
}

export const OrganizationContext = createContext<
  OrganizationContextType | undefined
>(undefined);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  const [isUploading, setIsUploading] = React.useState(false);

  const form = useForm<OrganizationFormValues>({
    defaultValues: {
      name: "",
      description: "",
      logoUrl: "",
      backgroundUrl: "",
      contactEmail: "",
    },
  });

  const { mutate: createOrganization, isPending } = useCreateOrganization({
    onSuccess: () => {
      form.reset();
      router.push("/");
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["owned-organizations"] });
    },
  });

  const onSubmit = useCallback(
    async (data: OrganizationFormValues) => {
      try {
        setIsUploading(true);
        const logo_url = await uploadToCloudinary(data.logoUrl || "");
        const background_url = await uploadToCloudinary(
          data.backgroundUrl || "",
        );
        createOrganization(
          toCreateOrganizationRequest({
            name: data.name,
            description: data.description,
            contact_email: data.contactEmail,
            logo_url,
            background_url,
          }),
        );
      } catch (error) {
        console.error("Organization submission failed:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [createOrganization],
  );

  const contextValue = useMemo(
    () => ({ form, onSubmit, isPending, isUploading }),
    [form, onSubmit, isPending, isUploading],
  );

  return (
    <OrganizationContext.Provider value={contextValue}>
      <FormProvider {...form}>{children}</FormProvider>
    </OrganizationContext.Provider>
  );
};
