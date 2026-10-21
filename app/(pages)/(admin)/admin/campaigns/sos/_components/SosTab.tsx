import { SosProvider } from "../_context/SosContext";
import { FormFilter } from "./FormFilter";
import { DataTable } from "./DataTable";

/** "SOS" tab of /admin/campaigns. */
export function SosTab() {
  return (
    <SosProvider>
      <div className="space-y-4">
        <FormFilter />
        <DataTable />
      </div>
    </SosProvider>
  );
}
