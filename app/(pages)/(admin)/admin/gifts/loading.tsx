import { Skeleton } from "@/components/ui/skeleton";

export default function AdminGiftsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
