import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingAdminOrganizationsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-36 w-full rounded-[10px]" />
      <Skeleton className="h-72 w-full rounded-[10px]" />
    </div>
  );
}
