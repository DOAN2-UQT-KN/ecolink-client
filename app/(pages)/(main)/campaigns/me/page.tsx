import { Breadcrumbs, BreadcrumbItemProps } from "@/components/client/shared/Breadcrumbs";
import { CampaignMeProvider } from "./_context/CampaignMeContext";
import MyCampaignsTable from "./_components/MyCampaignsTable";

/** Campaigns the viewer runs or joined. New campaigns start from the organization's page. */
function MyCampaignsPage() {
  const breadcrumbs: BreadcrumbItemProps[] = [
    { label: "Home", path: "/", type: "link" },
    { label: "My campaigns", path: "/campaigns/me", type: "page" },
  ];

  return (
    <CampaignMeProvider>
      <div>
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <div className="flex flex-col gap-8 items-start pt-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <MyCampaignsTable />
        </div>
      </div>
    </CampaignMeProvider>
  );
}

export default MyCampaignsPage;
