import { BreadcrumbItemProps } from "@/components/client/shared/Breadcrumbs";
import { ApplicationProvider } from "./_context/ApplicationContext";
import ApplyForm from "./_components/ApplyForm";

// `Breadcrumbs` runs every label through `t()` itself, so these stay raw English.
const breadcrumbs: BreadcrumbItemProps[] = [
  { label: "Home", path: "/", type: "link" },
  { label: "Organizations", path: "/organizations", type: "link" },
  { label: "Apply", path: "/organizations/apply", type: "page" },
];

export default function OrganizationApplyPage() {
  return (
    <ApplicationProvider>
      <ApplyForm breadcrumbs={breadcrumbs} />
    </ApplicationProvider>
  );
}
