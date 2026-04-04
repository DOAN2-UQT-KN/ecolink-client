import DataTable from "./components/DataTable";
import InforCards from "./components/InforCards";
import {
  Breadcrumbs,
  BreadcrumbItemProps,
} from "@/components/shared/Breadcrumbs";
import { useTranslation } from "react-i18next";

const breadcrumbs: BreadcrumbItemProps[] = [
  { label: "Home", path: "/", type: "link" },
  { label: "My incidents", path: "/incidents/me", type: "page" },
];

function MyIncidentsPage() {
  return (
    <div>
      <Breadcrumbs breadcrumbs={breadcrumbs} />

      <div className="flex flex-col gap-6 items-center justify-between pt-5">
        <InforCards />
        <DataTable />
      </div>
    </div>
  );
}

export default MyIncidentsPage;
