import { useMemo } from "react";

import CampaignForm from "./_components/CampaignForm";
import { CampaignProvider } from "./_context/CampaignContext";
import { useSearchParams } from "@/libs/router";
import useOrgContextStore from "@/stores/useOrgContextStore";
import { useCampaignCreatorOrganizations } from "@/hooks/useCampaignCreatorOrganizations";

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
      <CampaignForm />
    </CampaignProvider>
  );
}
