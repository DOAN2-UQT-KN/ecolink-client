import Image from '@/components/ui/AppImage';
import { cn } from '@/libs/utils';

type Props = { name: string; logoUrl?: string | null; className?: string };

/** Source logo, or the first letter of its name when there is no logo. */
export function SourceAvatar({ name, logoUrl, className }: Props) {
  return (
    <span
      className={cn(
        'relative inline-flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white text-xs font-semibold text-foreground-secondary',
        className,
      )}
      aria-hidden
    >
      {logoUrl ? (
        <Image src={logoUrl} alt="" fill className="object-contain" sizes="40px" />
      ) : (
        name.trim().charAt(0).toUpperCase() || '?'
      )}
    </span>
  );
}
