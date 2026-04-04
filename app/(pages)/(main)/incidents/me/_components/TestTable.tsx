"use client";

import React, { useState } from "react";
import { DataTable, ColumnType } from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SampleData {
  id: string;
  name: string;
  status: string;
  date: string;
}

const sampleDataSource: SampleData[] = Array.from({ length: 25 }, (_, i) => ({
  id: `INC-${1000 + i}`,
  name: `Incident Name ${i + 1}`,
  status: i % 3 === 0 ? "Pending" : i % 3 === 1 ? "In Progress" : "Resolved",
  date: new Date().toLocaleDateString(),
}));

const columns: ColumnType<SampleData>[] = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
    width: "120px",
  },
  {
    title: "Incident Name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status) => (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
        status === "Pending" ? "bg-yellow-100 text-yellow-800" :
        status === "In Progress" ? "bg-blue-100 text-blue-800" :
        "bg-green-100 text-green-800"
      }`}>
        {status}
      </span>
    ),
  },
  {
    title: "Date",
    dataIndex: "date",
    key: "date",
  },
];

export default function TestTable() {
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 25,
  });

  const handleTableChange = (page: any) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setPagination(page);
      setLoading(false);
    }, 500);
  };

  const currentData = sampleDataSource.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold">DataTable Component Demo</h2>
      
      <DataTable
        columns={columns}
        dataSource={currentData}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        filter={
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Search incidents..." />
          </div>
        }
      />
    </div>
  );
}
