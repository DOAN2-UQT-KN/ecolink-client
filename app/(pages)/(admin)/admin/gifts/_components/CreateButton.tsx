import { HiPlusCircle } from 'react-icons/hi2';

import { Button } from '@/components/ui/button';

/** Primary "create" action of a gifts tab, placed between its filters and its table. */
export function CreateButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="flex justify-end">
      <Button type="button" onClick={onClick} className="!h-[45px] cursor-pointer px-4">
        <span className="flex items-center gap-2">
          <HiPlusCircle className="size-5" aria-hidden />
          {label}
        </span>
      </Button>
    </div>
  );
}
