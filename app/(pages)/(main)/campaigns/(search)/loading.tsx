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

      <div className="space-y-4 pb-10">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white/60 p-6 shadow-sm space-y-5"
          >
            <Skeleton className="w-full h-[220px] rounded-lg" />
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
          </div>
        ))}
      </div>
    </div>
  );
}
