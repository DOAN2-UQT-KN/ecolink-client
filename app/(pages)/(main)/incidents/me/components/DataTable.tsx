"use client";

import { memo, useState } from "react";
import { DataTable, ColumnType } from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Search, MoreHorizontal, ExternalLink } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { useTranslation } from "react-i18next";

interface Incident {
  id: string;
  type: string;
  location: string;
  status: "Pending" | "In Progress" | "Resolved";
  date: string;
  priority: "Low" | "Medium" | "High";
}

const sampleIncidents: Incident[] = [
  { id: "INC-001", type: "Water Pollution", location: "Saigon River, Dist 1", status: "Pending", date: "2024-03-20", priority: "High" },
  { id: "INC-002", type: "Air Quality", location: "Hanoi Highway, Dist 2", status: "In Progress", date: "2024-03-18", priority: "Medium" },
  { id: "INC-003", type: "Illegal Dumping", location: "Binh Thanh, HCM", status: "Resolved", date: "2024-03-15", priority: "Low" },
  { id: "INC-004", type: "Deforestation", location: "Cu Chi District", status: "Pending", date: "2024-03-12", priority: "High" },
  { id: "INC-005", type: "Noise Pollution", location: "Pham Ngu Lao, Dist 1", status: "Resolved", date: "2024-03-10", priority: "Medium" },
  { id: "INC-006", type: "Plastic Waste", location: "Vung Tau Beach", status: "In Progress", date: "2024-03-05", priority: "Medium" },
  { id: "INC-007", type: "Chemical Leak", location: "Long Thanh Industrial Zone", status: "Pending", date: "2024-03-01", priority: "High" },
];

const DataTableComponent = memo(function DataTableComponent() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: sampleIncidents.length,
  });

  const columns: ColumnType<Incident>[] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      className: "font-mono font-medium text-primary",
      width: 100,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => t(type),
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      className: "max-w-[200px] truncate",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all",
          status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200 shadow-sm shadow-amber-100" :
          status === "In Progress" ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm shadow-blue-100" :
          "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-100"
        )}>
          {t(status)}
        </span>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => (
        <span className={cn(
          "font-medium",
          priority === "High" ? "text-destructive" :
          priority === "Medium" ? "text-amber-600" :
          "text-emerald-600"
        )}>
          {t(priority)}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button variant="outlined-green" size="small" className="h-8 px-2 group">
            <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
          </Button>
          <Button variant="outlined-brown" size="small" className="h-8 px-2 group">
            <MoreHorizontal className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
          </Button>
        </div>
      ),
    },
  ];

  const handleTableChange = (page: any) => {
    setLoading(true);
    setTimeout(() => {
      setPagination(page);
      setLoading(false);
    }, 600);
  };

  const currentData = sampleIncidents.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
      <DataTable
        columns={columns}
        dataSource={currentData}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        emptyText={t("No incidents reported yet")}
        filter={
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 mb-2">
            <h2 className="text-xl font-bold font-display-4 self-start">
              {t("My Reported Incidents")}
            </h2>
            <div className="relative w-full sm:w-72 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input 
                className="pl-10 h-10 bg-muted/20 border-border/50 focus:bg-background transition-all" 
                placeholder={t("Search by ID or Location...")} 
              />
            </div>
          </div>
        }
      />
    </div>
  );
});

// Helper for Tailwind classes inside components
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

export default DataTableComponent;
