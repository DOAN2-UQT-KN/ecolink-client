"use client";

import Address from "./_components/Address";
import FileUpload from "./_components/FileUpload";
import Information from "./_components/Information";

import { IncidentProvider } from "./_context/IncidentContext";
import { useIncident } from "./_hooks/useIncident";
import { Button } from "@/components/shared/Button";

import {
  Breadcrumbs,
  BreadcrumbItemProps,
} from "@/components/shared/Breadcrumbs";
import { useTranslation } from "react-i18next";
import { useCallback } from "react";

const breadcrumbs: BreadcrumbItemProps[] = [
  { label: "Home", path: "/", type: "link" },
  { label: "My incidents", path: "/incidents/me", type: "link" },
  { label: "Create", path: "/incidents/create", type: "page" },
];

function CreateIncidentContent() {
  const { t } = useTranslation("common");
  const { form, onSubmit, isPending } = useIncident();

  const handleCreate = useCallback(() => {
    form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  return (
    <div className="w-full h-full">
      <Breadcrumbs breadcrumbs={breadcrumbs} />
      {/* Main panel */}
      <div
        className={`
          flex flex-col gap-[30px] w-full h-full pt-5
        `}
      >
        <div className="md:grid md:grid-cols-2 md:gap-[30px] w-full h-full">
          <Information />
          <Address />
        </div>
        <div className="w-full h-full">
          <FileUpload />
        </div>
      </div>

      <div className="flex justify-end pt-5">
        <Button variant="brown" onClick={handleCreate} disabled={isPending}>
          {isPending ? t("Creating...") : t("Create")}
        </Button>
      </div>
    </div>
  );
}

export default function CreateIncidentPage() {
  return (
    <IncidentProvider>
      <CreateIncidentContent />
    </IncidentProvider>
  );
}
