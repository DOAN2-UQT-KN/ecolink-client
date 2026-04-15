"use client";

import { useEffect, useMemo, useState } from "react";
import { TbZoom, TbZoomReset } from "react-icons/tb";

import { Button } from "@/components/client/shared/Button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useOrganizationContext,
  type FormFilterValues,
} from "../_context/OrganizationContext";

type FormFieldConfig = {
  key: string;
  label: string;
  render: () => React.ReactNode;
};

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Active", value: "1" },
  { label: "Inactive", value: "2" },
  { label: "Pending", value: "12" },
  { label: "Approved", value: "14" },
  { label: "Rejected", value: "18" },
];

const SORT_BY_OPTIONS: Array<{ label: string; value: FormFilterValues["sortBy"] }> = [
  { label: "Created at", value: "created_at" },
  { label: "Updated at", value: "updated_at" },
  { label: "Name", value: "name" },
];

const SORT_ORDER_OPTIONS: Array<{ label: string; value: FormFilterValues["sortOrder"] }> = [
  { label: "Descending", value: "desc" },
  { label: "Ascending", value: "asc" },
];

export function FormFilter() {
  const { filters, onFilterChange, onResetFilters } = useOrganizationContext();
  const values = filters;
  const [searchInput, setSearchInput] = useState(values.search);
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    setSearchInput(values.search);
  }, [values.search]);

  useEffect(() => {
    const next = debouncedSearch.trim();
    if (next !== values.search) {
      onFilterChange({ search: next });
    }
  }, [debouncedSearch, onFilterChange, values.search]);

  const formFields: FormFieldConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        render: () => (
          <div className="relative">
            <TbZoom className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 pl-10 !border !border-zinc-300"
              placeholder="Name, email, description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: () => (
          <Select
            value={values.status}
            onValueChange={(value) => onFilterChange({ status: value })}
          >
            <SelectTrigger className="!h-10 w-full !border !border-zinc-300">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      // {
      //   key: "sortBy",
      //   label: "Sort by",
      //   render: () => (
      //     <Select
      //       value={values.sortBy}
      //       onValueChange={(value: FormFilterValues["sortBy"]) =>
      //         onFilterChange({ sortBy: value })
      //       }
      //     >
      //       <SelectTrigger className="!h-11 w-full">
      //         <SelectValue placeholder="Select field" />
      //       </SelectTrigger>
      //       <SelectContent>
      //         {SORT_BY_OPTIONS.map((item) => (
      //           <SelectItem key={item.value} value={item.value}>
      //             {item.label}
      //           </SelectItem>
      //         ))}
      //       </SelectContent>
      //     </Select>
      //   ),
      // },
      // {
      //   key: "sortOrder",
      //   label: "Sort order",
      //   render: () => (
      //     <Select
      //       value={values.sortOrder}
      //       onValueChange={(value: FormFilterValues["sortOrder"]) =>
      //         onFilterChange({ sortOrder: value })
      //       }
      //     >
      //       <SelectTrigger className="!h-11 w-full">
      //         <SelectValue placeholder="Select order" />
      //       </SelectTrigger>
      //       <SelectContent>
      //         {SORT_ORDER_OPTIONS.map((item) => (
      //           <SelectItem key={item.value} value={item.value}>
      //             {item.label}
      //           </SelectItem>
      //         ))}
      //       </SelectContent>
      //     </Select>
      //   ),
      // },
    ],
    [onFilterChange, searchInput, values.sortBy, values.sortOrder, values.status],
  );

  return (
    <div className="space-y-4 rounded-[10px] border border-zinc-200 bg-card p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {formFields.map((field) => (
          <Field key={field.key}>
            <FieldLabel className="text-sm font-medium text-foreground-secondary">
              {field.label}
            </FieldLabel>
            {field.render()}
          </Field>
        ))}
      </div>

     
    </div>
  );
}
