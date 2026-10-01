import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import Image from '@/components/ui/AppImage';
import { Pill } from '@/components/ui/Pill';
import { Skeleton } from '@/components/ui/skeleton';
import defaultAvatar from '@/public/default-avatar.png';

export interface AvatarListItem {
  id: string;
  avatar?: string | null;
  name?: string | null;
  checkedIn?: boolean;
}

/** People with avatar and name; optional attendance pill, badge and trailing action. */
export function AvatarList({
  isLoading,
  items,
  showAttendance,
  renderBadge,
  renderAction,
}: {
  isLoading: boolean;
  items: AvatarListItem[];
  showAttendance?: boolean;
  renderBadge?: (item: AvatarListItem) => ReactNode;
  renderAction?: (item: AvatarListItem) => ReactNode;
}) {
  const { t } = useTranslation('common');
  if (isLoading) {
    return (
      <ul className="divide-y divide-[rgba(136,122,71,0.2)]">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-32 max-w-full" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="divide-y divide-[rgba(136,122,71,0.2)]">
      {items.map((item) => (
        <li key={item.id} className="flex min-w-0 items-center gap-3 py-3 font-display-1">
          <Image
            src={item.avatar || defaultAvatar}
            alt={item.name || 'Default Avatar'}
            width={40}
            height={40}
            className="shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1 flex flex-col gap-1">
            <span className="min-w-0 break-words font-medium text-foreground">
              {item.name || '—'}
            </span>
            {showAttendance ? (
              <Pill tone={item.checkedIn ? 'green' : 'amber'}>
                {item.checkedIn ? t('Attendance checked in') : t('Attendance not checked in')}
              </Pill>
            ) : null}
            {renderBadge?.(item)}
          </div>
          {renderAction?.(item)}
        </li>
      ))}
    </ul>
  );
}
