"use client";

import Information from "./_components/Information";
import Preview from "./_components/Preview";

import { OrganizationProvider } from "./_context/OrganizationContext";
import { useOrganization } from "./_hooks/useOrganization";
import { Button } from "@/components/shared/Button";

import {
  Breadcrumbs,
  BreadcrumbItemProps,
} from "@/components/shared/Breadcrumbs";
import { useTranslation } from "react-i18next";
import { useCallback } from "react";

const breadcrumbs: BreadcrumbItemProps[] = [
  { label: "Home", path: "/", type: "link" },
  {
    label: "Create organization",
    path: "/organizations/create",
    type: "page",
  },
];

function CreateOrganizationContent() {
  const { t } = useTranslation("common");
  const { form, onSubmit, isPending, isUploading } = useOrganization();

  const handleCreate = useCallback(() => {
    form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  return (
    <div className="w-full h-full">
      <Breadcrumbs breadcrumbs={breadcrumbs} />
      <div
        className={`
          flex flex-col gap-[30px] w-full h-full pt-5
        `}
      >
        <div className="md:grid md:grid-cols-2 md:gap-[30px] w-full h-full md:items-start">
          <Information />
          <Preview />
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
}

export default function CreateOrganizationPage() {
  return (
    <OrganizationProvider>
      <CreateOrganizationContent />
    </OrganizationProvider>
  );
}
