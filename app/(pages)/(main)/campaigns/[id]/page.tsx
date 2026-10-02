import { Suspense, useMemo, useState } from 'react';
import { useParams } from '@/libs/router';
import { useTranslation } from 'react-i18next';
import { Inbox } from 'lucide-react';

import { Breadcrumbs, BreadcrumbItemProps } from '@/components/client/shared/Breadcrumbs';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';

import { CampaignTabs } from './_components/CampaignTabs';
import { CampaignDetailProvider } from './_context/CampaignDetailContext';
import { useCampaignDetail } from './_hooks/useCampaignDetail';
import { TbArrowRight, TbPencil } from 'react-icons/tb';
import { Button } from '@/components/client/shared/Button';
import { STATUS } from '@/constants/status';
import { CAMPAIGN_REGISTRABLE_STATUSES } from '@/constants/campaignLifecycle';
import { ConfirmPopoverModal } from '@/modules/OrganizationCard/components/ConfirmPopoverModal';
import { useMarkDoneCampaign } from '@/apis/campaign/campaignById';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';

import { CampaignAttendanceCheckInHandler } from './_components/CampaignAttendanceCheckInHandler';
import { CampaignAttendanceQrButton } from './_components/CampaignAttendanceQrButton';
import { CampaignCompletionVerifyButton } from './_components/CampaignCompletionVerifyButton';
import { JoinShiftsDialog } from './_components/JoinShiftsDialog';
import { useUpdateMyRegistrations } from '@/apis/campaign/registration';
import showMessage, { MessageLevel, MessageType } from '@/utils/showMessage';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import useAuthStore from '@/stores/useAuthStore';
import { useRouter } from '@/libs/router';

function CampaignDetailBody() {
  const { t } = useTranslation('common');
  const { title: localizedTitle } = useLocalizedDisplay();
  const {
    campaignId,
    campaign,
    isLoading,
    isError,
    canManageCampaign,
    isRegistered,
    hasOpenShift,
  } = useCampaignDetail();
  const [joinOpen, setJoinOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.is_authenticated);
  const router = useRouter();

  const { mutateAsync: updateMyShifts, isPending: isLeaving } = useUpdateMyRegistrations({
    onSuccess: () => {
      showMessage({ type: MessageType.Toast, level: MessageLevel.Success, title: t('You left the campaign') });
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
    },
  });
  /** Leaves every shift not started yet (spec 3.3); started ones stay with attendance. */
  const handleLeave = async () => {
    const now = Date.now();
    const keep = (campaign?.shifts ?? [])
      .filter((s) => campaign?.my_shift_ids?.includes(s.id) && new Date(s.start_at).getTime() <= now)
      .map((s) => s.id);
    await updateMyShifts({ campaign_id: campaignId, shift_ids: keep });
  };

  // Registration (spec 3.1): anyone, managers included, while a shift is still to come.
  const showJoinCta = isRegistered || hasOpenShift;
  const openJoin = () => {
    if (!isAuthenticated) {
      router.push(`/sign-in?redirect=${encodeURIComponent(`/campaigns/${campaignId}`)}`);
      return;
    }
    setJoinOpen(true);
  };

  const canOwnerSubmitCompletion =
    canManageCampaign &&
    (campaign?.status === STATUS.ACTIVE || campaign?.status === STATUS.INREVIEW);

  const showAwaitingAdminCompletion =
    canManageCampaign && campaign?.status === STATUS.WAITING_CONFIRMED;

  const showCompletionVerification =
    campaign?.status === STATUS.WAITING_CONFIRMED ||
    campaign?.status === STATUS.COMPLETED;

  const completionVerification = campaign?.completion_verification;

  const queryClient = useQueryClient();
  const { mutate: markDoneMutate, isPending: isMarkingDone } = useMarkDoneCampaign({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
    },
  });

  const handleMarkDone = () => {
    return new Promise<void>((resolve, reject) => {
      markDoneMutate(
        { id: campaignId },
        {
          onSuccess: () => resolve(),
          onError: () => reject(),
        },
      );
    });
  };

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t('Home'), path: '/', type: 'link' },
      {
        label: t('Campaigns'),
        path: '/campaigns',
        type: 'link',
      },
      {
        label: campaign
          ? localizedTitle(campaign).trim() || t('Campaign')
          : t('Campaign'),
        path: `/campaigns/${campaignId}`,
        type: 'page',
      },
    ],
    [t, campaign, campaignId, localizedTitle],
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-10">
        <div className="space-y-2 py-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="mt-4 flex flex-col overflow-hidden rounded-xl border border-border sm:flex-row">
          <Skeleton className="h-44 shrink-0 rounded-none sm:h-auto sm:min-h-[200px] sm:w-72" />
          <div className="flex min-w-0 flex-1 flex-col gap-3 p-5 sm:p-6">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-4/5 max-w-md" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-5 w-full">
          <Skeleton className="h-36 w-full max-w-sm rounded-2xl" />
          <Skeleton className="h-36 w-full max-w-sm rounded-2xl" />
          <Skeleton className="h-36 w-full max-w-sm rounded-2xl" />
        </div>
        <div className="mt-6">
          <Skeleton className="h-10 w-full max-w-md rounded-lg mb-4" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-10">
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <div className="flex justify-center pt-16">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Inbox className="h-12 w-12 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>{t('Campaign not found')}</EmptyTitle>
              <EmptyDescription>
                {t("We couldn't find the campaign you were looking for.")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-10 animate-in fade-in duration-500">
      <Breadcrumbs breadcrumbs={breadcrumbs} />

      <div className="pt-5 space-y-6">
        {(showCompletionVerification || showJoinCta) && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {showCompletionVerification ? (
              <CampaignCompletionVerifyButton
                campaignId={campaignId}
                cleanCount={completionVerification?.clean_count ?? 0}
                notCleanCount={completionVerification?.not_clean_count ?? 0}
                myVerification={completionVerification?.my_verification ?? null}
              />
            ) : null}
            {isRegistered ? (
              <>
                <ConfirmPopoverModal
                  title={t('Leave this campaign?')}
                  description={t(
                    'You leave every shift that has not started yet. You can register again at any time.',
                  )}
                  confirmLabel={t('Leave the campaign')}
                  cancelLabel={t('Cancel')}
                  confirmPending={isLeaving}
                  onConfirm={handleLeave}
                  trigger={
                    <Button type="button" variant="outlined-brown" size="medium">
                      {t('Leave the campaign')}
                    </Button>
                  }
                />
                <Button
                  type="button"
                  variant="outlined-brown"
                  size="medium"
                  iconLeft={<TbPencil className="size-4" aria-hidden />}
                  onClick={openJoin}
                >
                  {t('Edit my shifts')}
                </Button>
              </>
            ) : hasOpenShift ? (
              <Button
                type="button"
                variant="brown"
                size="medium"
                iconRight={<TbArrowRight className="size-4" aria-hidden />}
                onClick={openJoin}
              >
                {t('Join')}
              </Button>
            ) : null}
          </div>
        )}
        {!showJoinCta && CAMPAIGN_REGISTRABLE_STATUSES.includes(campaign.status ?? -1) ? (
          <div className="flex justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button type="button" variant="brown" size="medium" isDisabled>
                    {t('Join')}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{t('The campaign has no more upcoming shifts')}</TooltipContent>
            </Tooltip>
          </div>
        ) : null}
        <JoinShiftsDialog campaignId={campaignId} open={joinOpen} onOpenChange={setJoinOpen} />

        {showAwaitingAdminCompletion ? (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            {t(
              'Campaign awaiting admin completion hint',
            )}
          </div>
        ) : null}

        {canOwnerSubmitCompletion ||
        (canManageCampaign && campaign?.status === STATUS.ACTIVE) ? (
          <div className="flex flex-wrap justify-end gap-2">
            {canManageCampaign && campaign?.status === STATUS.ACTIVE ? (
              <CampaignAttendanceQrButton />
            ) : null}
            {canOwnerSubmitCompletion ? (
              <ConfirmPopoverModal
                title={t('Mark Campaign as Done')}
                description={t('Mark campaign done confirmation')}
                confirmLabel={t('Mark done')}
                cancelLabel={t('Cancel')}
                onConfirm={handleMarkDone}
                confirmPending={isMarkingDone}
                trigger={
                  <Button
                    type="button"
                    variant="brown"
                    size="medium"
                    isLoading={isMarkingDone}
                    className="!h-[45px]"
                    isDisabled={isMarkingDone}
                  >
                    {t('Mark done')}
                  </Button>
                }
              />
            ) : null}
          </div>
        ) : null}
        <div className="w-full min-w-0">
          <CampaignTabs />
        </div>
      </div>
    </div>
  );
}

export default function CampaignDetailPage() {
  const { id } = useParams() as { id: string };

  return (
    <CampaignDetailProvider campaignId={id}>
      <Suspense fallback={null}>
        <CampaignAttendanceCheckInHandler />
      </Suspense>
      <CampaignDetailBody />
    </CampaignDetailProvider>
  );
}
