import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileOrdersLoading() {
  return (
    <section className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white p-5 sm:p-6">
      <Skeleton className="h-7 w-24" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-[rgba(136,122,71,0.35)] bg-background/20 p-4"
          >
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="mt-3 h-4 w-2/3" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  );
}
