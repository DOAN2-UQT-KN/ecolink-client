import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-10">
      <div className="space-y-2 py-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="mt-4 space-y-4 rounded-xl border border-border/50 overflow-hidden bg-card/40 p-4">
        <Skeleton className="h-40 sm:h-48 w-full rounded-lg" />
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-24 w-24 rounded-full -mt-12" />
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-10 w-full max-w-md rounded-lg" />
        </div>
      </div>
      <div className="mt-6 flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-[70%] space-y-3">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="w-full lg:w-[30%]">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
