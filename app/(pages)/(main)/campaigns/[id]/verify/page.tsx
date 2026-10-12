import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TbArrowLeft } from 'react-icons/tb';

import { useCampaignVerification } from '@/apis/campaign/getCampaignVerification';
import type { IMeetingPointView, IVerificationTrashPoint } from '@/apis/campaign/models/verification';
import { Breadcrumbs } from '@/components/client/shared/Breadcrumbs';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { apiErrorMessage } from '@/constants/apiErrorMessages';
import { CAMPAIGN_STATUS } from '@/constants/campaignLifecycle';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';
import { Link, useParams, useSearchParams } from '@/libs/router';

import { meetingPointLabel } from '@/modules/CampaignVerification';
import { CampaignDetailProvider } from '../_context/CampaignDetailContext';
import { useCampaignDetail } from '../_hooks/useCampaignDetail';
import { useReportTitle } from '../_hooks/useReportTitle';
import { MeetingPointCard } from './_components/MeetingPointCard';
import { useNow } from './_hooks/useCountdown';
import { useVerifyFocus } from './_hooks/useVerifyFocus';
import { CANNOT_VOTE_LABEL } from './_services/verification.service';
import { CampaignNotFound } from '../_components/CampaignNotFound';
import { campaignCrumbs } from '../_services/breadcrumbs';

/**
 * Result verification of a campaign marked done (Layers 2 and 3), per meeting point: its waste
 * points with their photos and automatic check; residents say "clean" or "not clean" (with a note
 * or a photo, naming the waste points that are not clean), weighted by where they are. Managers
 * and admins also see the score and every vote. `?point=` scrolls to a meeting point; `?report=`
 * to the meeting point holding that waste point (notification links).
 */
function VerifyBody() {
  const { t } = useTranslation('common');
  const { title: localizedTitle } = useLocalizedDisplay();
  const searchParams = useSearchParams();
  const focusPointParam = searchParams.get('point');
  const focusReport = searchParams.get('report');
  const { campaignId, campaign } = useCampaignDetail();
  const { data, isLoading, isError, error } = useCampaignVerification(campaignId, {
    enabled: Boolean(campaignId),
    retry: false,
  });
  const view = data?.data;
  const now = useNow();

  const reportTitle = useReportTitle(campaign?.reports);
  const titleOf = useCallback(
    (tp: IVerificationTrashPoint) => reportTitle(tp.report_id, tp.report?.title),
    [reportTitle],
  );
  const labelOf = (point: IMeetingPointView, fallbackIndex: number) => {
    const index = (campaign?.meeting_points ?? []).findIndex((p) => p.id === point.meeting_point_id);
    return meetingPointLabel(point.name, index >= 0 ? index : fallbackIndex, t);
  };

  const focusPoint = useVerifyFocus(focusPointParam, focusReport, view?.meeting_points);

  const campaignTitle = campaign ? localizedTitle(campaign).trim() || t('Campaign') : t('Campaign');
  const breadcrumbs = campaignCrumbs(campaignId, campaignTitle, {
    label: 'Verify the result',
    path: `/campaigns/${campaignId}/verify`,
    type: 'page',
  });

  const completed = view?.campaign_status === CAMPAIGN_STATUS.COMPLETED;

  return (
    <div className="max-w-5xl mx-auto w-full px-4 lg:px-8 pb-10 animate-in fade-in duration-500">
      <Breadcrumbs breadcrumbs={breadcrumbs} />
      <div className="flex flex-col gap-5 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display-7 font-semibold !text-button-accent">{t('Verify the result')}</h2>
              <InfoTooltip
                content={t(
                  'Did the team really clean these places? Each meeting point lists its waste points with photos before and after: look at them, or go and see, then vote once for the meeting point. It is verified after 72 hours, or earlier once enough people confirm it.',
                )}
                label={t('How verification works')}
                contentClassName="max-w-sm"
              />
            </div>
            <p className="text-sm text-foreground-secondary">{campaignTitle}</p>
          </div>
          <Link
            href={`/campaigns/${campaignId}`}
            className="inline-flex items-center gap-1 text-sm text-button-accent hover:underline"
          >
            <TbArrowLeft className="size-4" aria-hidden />
            {t('Back to the campaign')}
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : isError || !view ? (
          <div className="flex justify-center pt-10">
            <CampaignNotFound
              title={t('Result verification is not open for this campaign')}
              description={
                (error && apiErrorMessage(error, t)) ||
                t('It opens once the campaign is marked done, and stays visible after it is completed.')
              }
            />
          </div>
        ) : (
          <>
            {completed && (
              <div className="rounded-lg border border-[rgba(136,122,71,0.3)] bg-white/70 px-4 py-3 text-sm text-foreground-secondary">
                {t('The campaign is completed. The votes below are kept for the record.')}
              </div>
            )}
            {view.awaiting_admin && (
              <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {view.awaiting_admin_reason === 'no_cleaned_points'
                  ? t('No waste point was declared cleaned: the admin decides whether the campaign is completed.')
                  : t('The completion was not accepted {{n}} times: the admin now decides.', {
                      n: view.rejection_count,
                    })}
              </div>
            )}
            {view.cannot_vote_reason && !completed && (
              <p className="text-sm text-foreground-tertiary">{t(CANNOT_VOTE_LABEL[view.cannot_vote_reason])}</p>
            )}
            {view.meeting_points.length === 0 ? (
              <p className="text-sm text-foreground-tertiary">{t('No meeting point is being verified.')}</p>
            ) : (
              view.meeting_points.map((point, index) => (
                <MeetingPointCard
                  key={point.verification_id}
                  campaignId={campaignId}
                  point={point}
                  label={labelOf(point, index)}
                  titleOf={titleOf}
                  highlighted={focusPoint === point.meeting_point_id}
                  globalCannotVote={view.cannot_vote_reason}
                  canSeeVotes={view.can_see_votes}
                  canDecide={view.can_decide}
                  now={now}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CampaignVerifyPage() {
  const { id } = useParams() as { id: string };
  return (
    <CampaignDetailProvider campaignId={id}>
      <VerifyBody />
    </CampaignDetailProvider>
  );
}
