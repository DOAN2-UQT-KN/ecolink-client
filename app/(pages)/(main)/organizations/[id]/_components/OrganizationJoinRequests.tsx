'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useGetJoinRequestsByOrg } from '@/apis/organization/organizationById';
import { useProcessJoinRequest } from '@/apis/organization/joinRequest';
import type { IGetJoinRequestsRequest } from '@/apis/organization/models/joinRequestModels';
import { Button as SharedButton } from '@/components/client/shared/Button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS } from '@/constants/status';

import { useOrganizationDetail } from '../_hooks/useOrganizationDetail';

import defaultAvatar from '@/public/default-avatar.png';
import Image from 'next/image';

import { HiCheck, HiOutlineX } from 'react-icons/hi';

function formatRequestedAt(iso: string | undefined): string {
  if (!iso?.trim()) return '—';
  try {
    return format(parseISO(iso), 'PPp');
  } catch {
    return iso;
  }
}

function shortUserId(id: string): string {
  if (id?.length <= 14) return id;
  return `${id?.slice(0, 6)}…${id?.slice(-4)}`;
}

export const OrganizationJoinRequests = memo(function OrganizationJoinRequests({
  enabled,
}: {
  enabled: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { organizationId, organization } = useOrganizationDetail();
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    approved: boolean;
  } | null>(null);

  const listRequest = useMemo((): IGetJoinRequestsRequest => {
    return {
      organization_id: organizationId,
      page: 1,
      limit: 50,
      status: STATUS.PENDING,
      sort_by: 'created_at',
      sort_order: 'desc',
    };
  }, [organizationId]);

  const { data, isLoading, isError } = useGetJoinRequestsByOrg(listRequest, {
    enabled: enabled && Boolean(organizationId),
  });

  const { mutate } = useProcessJoinRequest({
    onSettled: () => {
      setPendingAction(null);
      void queryClient.invalidateQueries({
        queryKey: ['organization-join-requests', organizationId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['organization', organizationId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['organization-members', organizationId],
      });
    },
  });

  const handleProcess = useCallback(
    (requestId: string, approved: boolean) => {
      setPendingAction({ id: requestId, approved });
      mutate({ request_id: requestId, approved });
    },
    [mutate],
  );

  const rows = data?.data?.join_requests ?? [];

  if (!organization) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[rgba(136,122,71,0.35)] bg-white/60 p-4 sm:p-5 shadow-sm">
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">{t('Could not load join requests.')}</p>
      ) : rows.length === 0 ? (
        <div className="flex justify-center pt-12 pb-20">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox className="h-12 w-12 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>{t('No pending join requests.')}</EmptyTitle>
              <EmptyDescription>
                {t('When someone asks to join your group, their request will appear here.')}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {rows.map((jr) => {
            const rowPending = pendingAction?.id === jr.id;
            return (
              <li
                key={jr.id}
                className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 space-y-1 flex flex-row items-center justify-center gap-2">
                  <div className="flex items-center gap-2">
                    <Image
                      src={jr.requester?.avatar || defaultAvatar}
                      alt={jr.requester?.name || 'Default Avatar'}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-medium text-foreground break-words">
                      {jr.requester?.name || jr.requester?.email || shortUserId(jr.requester_id)}
                    </div>
                    <p className="text-xs text-foreground-tertiary">
                      {formatRequestedAt(jr.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  <SharedButton
                    variant="brown"
                    size="small"
                    className="min-w-[96px] !h-[40px]"
                    isLoading={rowPending && pendingAction?.approved === true}
                    isDisabled={pendingAction != null}
                    onClick={() => handleProcess(jr.id, true)}
                  >
                    <div className="flex items-center gap-2 justify-center w-full">
                      <HiCheck className="size-4" />
                      {t('Verify')}
                    </div>
                  </SharedButton>
                  <SharedButton
                    variant="outlined-brown"
                    size="small"
                    className="min-w-[96px] !h-[40px]"
                    isLoading={rowPending && pendingAction?.approved === false}
                    isDisabled={pendingAction != null}
                    onClick={() => handleProcess(jr.id, false)}
                  >
                    <div className="flex items-center gap-2 justify-center w-full">
                      <HiOutlineX className="size-4" />
                      {t('Decline')}
                    </div>
                  </SharedButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});
