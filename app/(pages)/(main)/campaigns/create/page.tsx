import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  BreadcrumbItemProps,  
  Breadcrumbs,
} from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/client/shared/Button";

import GeneralInformation from "./_components/GeneralInformation";
import IncidentList from "./_components/IncidentList";
import LeafletAddress from "./_components/LeafletAddress";
import { CampaignProvider } from "./_context/CampaignContext";
import { useCampaign } from "./_hooks/useCampaign";
import { cn } from "@/libs/utils";
import { useSearchParams } from "@/libs/router";
import useOrgContextStore from "@/stores/useOrgContextStore";
import { useCampaignCreatorOrganizations } from "@/hooks/useCampaignCreatorOrganizations";

const CreateCampaignContent = memo(function CreateCampaignContent() {
  const { t } = useTranslation("common");
  const { form, onSubmit, isPending, isUploading } = useCampaign();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      <div
        className={cn(
          "sticky top-0 z-[45] bg-background-primary pb-4 -mx-4 px-4 lg:-mx-20 lg:px-20",
          isScrolled ? "pt-[100px]" : "pt-0",
        )}
      >
        <Breadcrumbs breadcrumbs={breadcrumbs} />
      </div>
      <div className="flex flex-col gap-[20px] w-full h-full pt-5">
        <GeneralInformation />
        <div className="flex flex-col md:flex-row gap-[20px] w-full h-full md:items-start">
          <div className="w-full md:w-1/2 h-full">
            <LeafletAddress />
          </div>
          <div className="w-full md:w-1/2 h-full">
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

export default function CreateCampaignPage() {
  const searchParams = useSearchParams();
  const urlOrganizationId = searchParams.get("organizationId") ?? "";
  const activeOrganizationId = useOrgContextStore((s) => s.activeOrganizationId);
  const { organizations } = useCampaignCreatorOrganizations();

  // ?organizationId= → active org context (only if the viewer may create campaigns there) → none.
  const defaultOrganizationId = useMemo(() => {
    if (urlOrganizationId) return urlOrganizationId;
    if (
      activeOrganizationId &&
      organizations.some((org) => org.id === activeOrganizationId)
    ) {
      return activeOrganizationId;
    }
    return "";
  }, [urlOrganizationId, activeOrganizationId, organizations]);

  return (
    <CampaignProvider organizationId={defaultOrganizationId || undefined}>
      <CreateCampaignContent />
    </CampaignProvider>
  );
}
