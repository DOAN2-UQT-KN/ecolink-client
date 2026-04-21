"use client";

import Address from "./_components/Address";
import FileUpload from "./_components/FileUpload";
import Information from "./_components/Information";

import { IncidentProvider } from "./_context/IncidentContext";
import { useIncident } from "./_hooks/useIncident";
import { Button } from "@/components/client/shared/Button";

import {
  Breadcrumbs,
  BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/libs/utils";

const breadcrumbs: BreadcrumbItemProps[] = [
  { label: "Home", path: "/", type: "link" },
  { label: "My incidents", path: "/incidents/me", type: "link" },
  { label: "Create", path: "/incidents/create", type: "page" },
];

function CreateIncidentContent() {
  const { t } = useTranslation("common");
  const { form, onSubmit, isPending, isUploading } = useIncident();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCreate = useCallback(() => {
    form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  return (
    <div className="w-full h-full">
      <div
        className={cn(
          "sticky top-0 z-[45] bg-background-primary pb-4 -mx-4 px-4 lg:-mx-20 lg:px-20",
          isScrolled ? "pt-[100px]" : "pt-0",
        )}
      >
        <Breadcrumbs breadcrumbs={breadcrumbs} />
      </div>
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

export default function CreateIncidentPage() {
  return (
    <IncidentProvider>
      <CreateIncidentContent />
    </IncidentProvider>
  );
}
