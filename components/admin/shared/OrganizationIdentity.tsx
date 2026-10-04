import { memo } from 'react';
import { Building2 } from 'lucide-react';
import { TbExternalLink } from 'react-icons/tb';

import type { ICampaign } from '@/apis/campaign/models/campaign';
import Image from '@/components/ui/AppImage';
import { cn } from '@/libs/utils';

type OrganizationSummary = NonNullable<ICampaign['organization']>;

/**
 * Logo, name and contact email of an organization in the admin console. `inline` fits a table
 * cell; `card` is a framed block that links to the organization's page when it has a slug.
 */
export const OrganizationIdentity = memo(function OrganizationIdentity({
  org,
  isDark,
  variant = 'inline',
}: {
  org?: OrganizationSummary | null;
  isDark: boolean;
  variant?: 'inline' | 'card';
}) {
  const isCard = variant === 'card';

  const content = (
    <>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full overflow-hidden ring-1 text-xs font-semibold',
          isCard ? 'h-10 w-10' : 'h-8 w-8',
          isDark
            ? 'ring-zinc-600 bg-zinc-800 text-zinc-300'
            : 'ring-zinc-300 bg-zinc-200 text-zinc-600',
        )}
      >
        {org?.logo_url ? (
          <Image src={org.logo_url} alt={org.name} className="h-full w-full object-cover" />
        ) : (
          <Building2 className={isCard ? 'h-5 w-5' : 'h-4 w-4'} />
        )}
      </div>
      <div className="flex min-w-0 flex-col leading-tight">
        <span
          className={cn(
            'text-sm',
            isCard ? 'font-semibold' : 'font-medium',
            isDark ? 'text-zinc-100' : 'text-zinc-900',
          )}
        >
          {org?.name || '—'}
        </span>
        <span className="text-xs text-zinc-500">{org?.contact_email || '—'}</span>
      </div>
    </>
  );

  if (!isCard) {
    return <div className="flex items-center gap-2 min-w-[160px]">{content}</div>;
  }

  const cardClassName = cn(
    'flex w-fit max-w-full items-center gap-3 rounded-lg border p-3',
    isDark ? 'border-zinc-700 bg-zinc-800/60' : 'border-zinc-200 bg-zinc-50',
  );

  if (!org?.slug) {
    return <div className={cardClassName}>{content}</div>;
  }

  return (
    <a
      href={`/organizations/${org.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        cardClassName,
        'transition-colors',
        isDark ? 'hover:bg-zinc-800' : 'hover:bg-white',
      )}
    >
      {content}
      <TbExternalLink className="ml-2 size-4 shrink-0 text-zinc-500" />
    </a>
  );
});

export default OrganizationIdentity;
