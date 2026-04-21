"use client";

import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  BreadcrumbItemProps,  
  Breadcrumbs,
} from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/client/shared/Button";

import GeneralInformation from "./_components/GeneralInformation";
import IncidentList from "./_components/IncidentList";
import { CampaignProvider } from "./_context/CampaignContext";
import { useCampaign } from "./_hooks/useCampaign";

const CreateCampaignContent = memo(function CreateCampaignContent({
  organizationId,
}: {
  organizationId?: string;
}) {
  const { t } = useTranslation("common");
  const { form, onSubmit, isPending, isUploading } = useCampaign();

  const breadcrumbs = useMemo<BreadcrumbItemProps[]>(
    () => [
      { label: "Home", path: "/", type: "link" },
      { label: "My organizations", path: "/organizations/me", type: "link" },
      { label: "Create campaign", path: "#", type: "page" },
    ],
    [],
  );

  const handleCreate = useCallback(() => {
    form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  return (
    <div className="w-full h-full">
      <Breadcrumbs breadcrumbs={breadcrumbs} />
      <div className="flex flex-col gap-[30px] w-full h-full pt-5">
        <div className="md:grid md:grid-cols-3 md:gap-[30px] w-full h-full md:items-start">
          <div className="md:col-span-1 h-full">
            <GeneralInformation organizationId={organizationId} />
          </div>
          <div className="md:col-span-2 h-full">
            <IncidentList />
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-5">
        <Button
          variant="brown"
          onClick={handleCreate}
          disabled={isPending || isUploading}
        >
          {isUploading
            ? t("Uploading...")
            : isPending
              ? t("Creating...")
              : t("Create")}
        </Button>
      </div>
    </div>
  );
});

export default function CreateCampaignPage({
  organizationId,
}: {
  organizationId?: string;
}) {
  return (
    <CampaignProvider organizationId={organizationId}>
      <CreateCampaignContent organizationId={organizationId} />
    </CampaignProvider>
  );
}
