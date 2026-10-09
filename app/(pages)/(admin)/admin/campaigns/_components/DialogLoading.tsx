import { useAdminLayout } from '@/app/(pages)/(admin)/_context/AdminLayoutContext';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/libs/utils';

/** Shown while a lazy review dialog's code loads, so the click opens a dialog right away. */
export function DialogLoading() {
  const { theme } = useAdminLayout();
  return (
    <Dialog open>
      <DialogContent
        className={cn(
          'max-h-[90vh] max-w-4xl',
          theme === 'dark' ? 'bg-zinc-900 text-zinc-100' : 'bg-zinc-50 text-zinc-900',
        )}
      >
        <DialogTitle className="sr-only">…</DialogTitle>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
