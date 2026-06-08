'use client';

import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from '@/libs/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/client/shared/DropdownMenu';
import useAuthStore from '@/stores/useAuthStore';
import { listMyNotifications } from '@/apis/notification/listMyNotifications';
import { markNotificationRead } from '@/apis/notification/markNotificationRead';
import type { INotificationItem } from '@/apis/notification/models/notification';
import { getLocalizedNotificationText, getNotificationHref } from '@/libs/notificationDisplay';
import { cn } from '@/libs/utils';
import { formatDistanceToNow } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';

const NOTIFICATIONS_QUERY_KEY = ['notifications', 'my'] as const;

export const NotificationMenu = memo(function NotificationMenu() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => listMyNotifications({ limit: 40 }),
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });

  const items = data?.data?.items ?? [];
  const unreadCount = data?.data?.unreadCount ?? 0;

  const dateLocale = i18n.language?.toLowerCase().startsWith('vi') ? vi : enUS;

  const onItemActivate = useCallback(
    async (item: INotificationItem) => {
      if (!item.readAt) {
        try {
          await markReadMutation.mutateAsync(item.id);
        } catch {
          /* best-effort */
        }
      }
      const href = getNotificationHref(item.kind, item.payload);
      if (href) {
        router.push(href);
      }
    },
    [markReadMutation, router],
  );

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/60 text-foreground transition-colors hover:bg-white/90"
          aria-label={t('Notifications')}
        >
          <Bell className="h-[18px] w-[18px]" aria-hidden />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-button-accent px-1 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(100vw-2rem,380px)] max-h-[min(420px,70vh)] overflow-y-auto p-0"
        sideOffset={8}
      >
        <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 px-3 py-2 backdrop-blur-sm">
          <p className="text-sm font-semibold text-foreground">{t('Notifications')}</p>
        </div>
        {isLoading ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">{t('Loading...')}</p>
        ) : items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            {t('No notifications yet')}
          </p>
        ) : (
          <ul className="divide-y divide-border/50">
            {items.map((item) => {
              const { title, body } = getLocalizedNotificationText(item, i18n.language);
              const unread = !item.readAt;
              const href = getNotificationHref(item.kind, item.payload);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/80',
                      unread && 'bg-primary/5',
                    )}
                    onClick={() => void onItemActivate(item)}
                  >
                    <span className="font-medium text-foreground leading-snug">{title}</span>
                    <span className="text-xs text-muted-foreground line-clamp-2">{body}</span>
                    <span className="text-[10px] text-muted-foreground/80">
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                      {href ? ` · ${t('Open')}` : ''}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
