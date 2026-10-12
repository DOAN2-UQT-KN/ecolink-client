import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import CampaignForm from "./_components/CampaignForm";
import { CampaignProvider } from "./_context/CampaignContext";
import { useRouter, useSearchParams } from "@/libs/router";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampaignCreatorOrganizations } from "@/hooks/useCampaignCreatorOrganizations";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";

/**
 * New campaign for the organization in `?organizationId=` (opened from the organization's
 * Campaigns tab). Without one the viewer may create for, go back to My organizations.
 */
export default function CreateCampaignPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("organizationId") ?? "";
  const { organizations, isLoading } = useCampaignCreatorOrganizations();

  // `find` returns the same element while the list is unchanged, so the effect below stays stable.
  const organization = organizations.find((org) => org.id === organizationId);

  // Redirect is a navigation side effect, so it stays in an effect.
  useEffect(() => {
    if (isLoading || organization) return;
    showMessage({
      type: MessageType.Toast,
      level: MessageLevel.Error,
      title: t("Open an organization to create a campaign"),
    });
    router.replace("/organizations/me");
  }, [isLoading, organization, router, t]);

  if (!organization) {
    return <Skeleton className="h-[480px] w-full rounded-[10px]" />;
  }

  return (
    <CampaignProvider
      organizationId={organization.id}
      organization={{ id: organization.id, name: organization.name, logo_url: organization.logo_url }}
    >
      <CampaignForm />
    </CampaignProvider>
  );
}
