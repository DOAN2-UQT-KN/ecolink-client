import { ApplicationsProvider } from "../_context/ApplicationsContext";
import { FormFilter } from "./FormFilter";
import { DataTable } from "./DataTable";

/** "Organization applications" tab of /admin/organizations. */
export function ApplicationsTab() {
  return (
    <ApplicationsProvider>
      <div className="space-y-4">
        <FormFilter />
        <DataTable />
      </div>
    </ApplicationsProvider>
  );
}
