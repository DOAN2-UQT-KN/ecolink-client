"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingAdminGamificationConfigPage() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
