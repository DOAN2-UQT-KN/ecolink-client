"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Inbox } from "lucide-react";

import {
  Breadcrumbs,
  BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

import { OrganizationDetailTabs } from "./_components/OrganizationDetailTabs";
import { GeneralInformation } from "./_components/GeneralInformation";
import { HeroSection } from "./_components/HeroSection";
import { OrganizationDetailProvider } from "./_context/OrganizationDetailContext";
import { useOrganizationDetail } from "./_hooks/useOrganizationDetail";

function OrganizationDetailBody() {
  const { t } = useTranslation();
  const {
    organizationId,
    organization,
    isLoading,
    isError,
  } = useOrganizationDetail();

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t("Home"), path: "/", type: "link" },
      {
        label: t("Organizations"),
        path: "/organizations",
        type: "link",
      },
      {
        label: organization?.name?.trim()
          ? organization.name
          : t("Organization"),
        path: `/organizations/${organizationId}`,
        type: "page",
      },
    ],
    [t, organization, organizationId],
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-10">
        <div className="space-y-2 py-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="mt-4 space-y-4 rounded-xl border border-border/50 overflow-hidden bg-card/40 p-4">
          <Skeleton className="h-40 sm:h-48 w-full rounded-lg" />
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-24 w-24 rounded-full -mt-12" />
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-10 w-full max-w-md rounded-lg" />
          </div>
        </div>
        <div className="mt-6 flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-[70%] space-y-3">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <div className="w-full lg:w-[30%]">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !organization) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-10">
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <div className="flex justify-center pt-16">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox className="h-12 w-12 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>{t("Organization not found")}</EmptyTitle>
              <EmptyDescription>
                {t(
                  "We couldn't find the organization you were looking for.",
                )}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-10 animate-in fade-in duration-500">
      <Breadcrumbs breadcrumbs={breadcrumbs} />
      <div className="pt-5">
        <HeroSection />
        <div className="mt-6 flex flex-col lg:flex-row gap-6 items-start">
          <div className="w-full lg:w-[70%] lg:min-w-0">
            <OrganizationDetailTabs />
          </div>
          <div className="w-full lg:w-[30%] lg:shrink-0">
            <GeneralInformation />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrganizationDetailPage() {
  const { id } = useParams() as { id: string };

  return (
    <OrganizationDetailProvider organizationId={id}>
      <OrganizationDetailBody />
    </OrganizationDetailProvider>
  );
}
