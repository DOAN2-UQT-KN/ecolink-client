"use client";


import Address from "./_components/Address";
import FileUpload from "./_components/FileUpload";
import Information from "./_components/Information";

import { IncidentProvider, useIncidentContext } from "./_components/IncidentContext";
import { Button } from "@/components/shared/Button";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useTranslation } from "react-i18next";

function CreateIncidentContent() {
  const { t } = useTranslation("common");
  const { form, onSubmit, isPending } = useIncidentContext();

  return (
    <div className="w-full h-full">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="text-button-accent-hover">
              {t("Home")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href="/components"
              className="text-button-accent-hover"
            >
              {t("My incidents")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-button-accent">
              {t("Create")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
        <Button
          variant="brown"
          onClick={() => form.handleSubmit(onSubmit)()}
          disabled={isPending}
        >
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
