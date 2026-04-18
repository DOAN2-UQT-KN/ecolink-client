import React from "react";

import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto w-full relative px-4 lg:px-20 animate-pulse">
      <div className="py-4 mb-6 space-y-4">
        <Skeleton className="h-4 w-48" />
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <Skeleton className="h-11 flex-1 min-w-[200px]" />
          <Skeleton className="h-11 w-full lg:w-48" />
          <Skeleton className="h-11 w-full lg:w-40" />
          <Skeleton className="h-11 w-full lg:w-36" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="border border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 overflow-hidden space-y-4 p-4"
          >
            <Skeleton className="h-28 w-full rounded-t-[10px]" />
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-20 w-20 rounded-full -mt-10" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
