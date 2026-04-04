"use client";

import Address from "./_components/Address";
import FileUpload from "./_components/FileUpload";
import Information from "./_components/Information";

import { IncidentProvider } from "./_context/IncidentContext";
import { useIncident } from "./_hooks/useIncident";
import { Button } from "@/components/shared/Button";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import React, { Fragment, useCallback } from "react";

const breadcrumbs = [
  { label: "Home", path: "/", type: "link" },
  { label: "My incidents", path: "/incidents/me", type: "link" },
  { label: "Create", path: "/incidents/create", type: "page" },
];

function CreateIncidentContent() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { form, onSubmit, isPending } = useIncident();

  const renderBreadcrums = useCallback(
    () => (
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((item, index) => (
            <Fragment key={item.path}>
              <BreadcrumbItem>
                {item.type === "link" ? (
                  <BreadcrumbLink
                    className="text-button-accent-hover cursor-pointer"
                    onClick={() => router.push(item.path)}
                  >
                    {t(item.label)}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="text-button-accent">
                    {t(item.label)}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    ),
    [t],
  );

  return (
    <div className="w-full h-full">
      {renderBreadcrums()}
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
