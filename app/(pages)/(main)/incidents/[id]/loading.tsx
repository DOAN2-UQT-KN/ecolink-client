import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-10">
      <div className="py-4">
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-4 pt-1">
        <Skeleton className="h-10 w-full sm:w-64 rounded-[8px]" />
        <Skeleton className="h-96 w-full rounded-[10px]" />
      </div>
    </div>
  );
}
