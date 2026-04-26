import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-10">
      <div className="space-y-2 py-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="mt-4 space-y-4">
        <Skeleton className="h-48 sm:h-64 w-full rounded-xl" />
      </div>
      <div className="mt-6 flex flex-col sm:flex-row gap-5 w-full">
        <Skeleton className="h-36 w-full max-w-sm rounded-2xl" />
        <Skeleton className="h-36 w-full max-w-sm rounded-2xl" />
        <Skeleton className="h-36 w-full max-w-sm rounded-2xl" />
      </div>
      <div className="mt-6">
        <Skeleton className="h-10 w-full max-w-md rounded-lg mb-4" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
