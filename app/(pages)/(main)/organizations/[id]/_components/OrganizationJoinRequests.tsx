"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useGetJoinRequestsByOrg } from "@/apis/organization/organizationById";
import { useProcessJoinRequest } from "@/apis/organization/joinRequest";
import type { IGetJoinRequestsRequest } from "@/apis/organization/models/joinRequestModels";
import { Button as SharedButton } from "@/components/client/shared/Button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS } from "@/constants/status";

import { useOrganizationDetail } from "../_hooks/useOrganizationDetail";

function formatRequestedAt(iso: string | undefined): string {
  if (!iso?.trim()) return "—";
  try {
    return format(parseISO(iso), "PPp");
  } catch {
    return iso;
  }
}

function shortUserId(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
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
      sort_by: "created_at",
      sort_order: "desc",
    };
  }, [organizationId]);

  const { data, isLoading, isError } = useGetJoinRequestsByOrg(listRequest, {
    enabled: enabled && Boolean(organizationId),
  });

  const { mutate } = useProcessJoinRequest({
    onSettled: () => {
      setPendingAction(null);
      void queryClient.invalidateQueries({
        queryKey: ["organization-join-requests", organizationId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["organization", organizationId],
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
        <p className="text-sm text-destructive">
          {t("Could not load join requests.")}
        </p>
      ) : rows.length === 0 ? (
        <div className="flex justify-center pt-12 pb-20">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox className="h-12 w-12 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>{t("No pending join requests.")}</EmptyTitle>
              <EmptyDescription>
                {t(
                  "When someone asks to join your group, their request will appear here.",
                )}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {rows.map((jr) => {
            const name = jr.requester?.name?.trim();
            const email = jr.requester?.email?.trim();
            const rowPending = pendingAction?.id === jr.id;
            const primary =
              name || email || shortUserId(jr.requester_id);
            const showEmailLine = Boolean(name && email);
            const showIdLine = Boolean(name || email);

            return (
              <li
                key={jr.id}
                className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-foreground-tertiary">
                    {t("Requester")}
                  </p>
                  <div className="text-sm font-medium text-foreground break-words">
                    {primary}
                  </div>
                  {showEmailLine ? (
                    <div className="text-xs text-foreground-secondary break-all">
                      {email}
                    </div>
                  ) : null}
                  {showIdLine ? (
                    <div className="text-xs text-foreground-secondary break-all">
                      {shortUserId(jr.requester_id)}
                    </div>
                  ) : null}
                  <p className="text-xs text-foreground-secondary">
                    {formatRequestedAt(jr.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  <SharedButton
                    variant="brown"
                    size="small"
                    className="min-w-[96px]"
                    isLoading={
                      rowPending && pendingAction?.approved === true
                    }
                    isDisabled={pendingAction != null}
                    onClick={() => handleProcess(jr.id, true)}
                  >
                    {t("Verify")}
                  </SharedButton>
                  <SharedButton
                    variant="outlined-brown"
                    size="small"
                    className="min-w-[96px]"
                    isLoading={
                      rowPending && pendingAction?.approved === false
                    }
                    isDisabled={pendingAction != null}
                    onClick={() => handleProcess(jr.id, false)}
                  >
                    {t("Decline")}
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
