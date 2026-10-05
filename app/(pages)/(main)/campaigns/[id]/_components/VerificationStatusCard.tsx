import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TbArrowRight } from 'react-icons/tb';

import type { ICampaign } from '@/apis/campaign/models/campaign';
import { useCampaignVerification } from '@/apis/campaign/verification';
import { CollapsibleCard } from '@/components/client/shared/CollapsibleCard';
import { Pill } from '@/components/ui/Pill';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocalizedDisplay } from '@/hooks/useLocalizedDisplay';
import { Link } from '@/libs/router';
import {
  CHECK_LEVEL_LABEL,
  CHECK_LEVEL_TONE,
  meetingPointLabel,
  MeetingPointStatusPill,
} from './ResultVerificationBadges';

/**
 * For the campaign's managers while it waits for completion: where result verification stands on
 * each meeting point (status, photo check, votes and score; the waste points that did not pass).
 */
export const VerificationStatusCard = memo(function VerificationStatusCard({ campaign }: { campaign: ICampaign }) {
  const { t } = useTranslation('common');
  const { title: localizedTitle } = useLocalizedDisplay();
  const { data, isLoading } = useCampaignVerification(campaign.id, { enabled: Boolean(campaign.id), retry: false });
  const view = data?.data;
  const points = view?.meeting_points ?? [];
  const reportById = useMemo(() => new Map((campaign.reports ?? []).map((r) => [r.id, r])), [campaign.reports]);

  const counts = points.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <CollapsibleCard
      title={t('Result verification')}
      actions={
        <Link
          href={`/campaigns/${campaign.id}/verify`}
          className="inline-flex items-center gap-1 text-sm text-button-accent hover:underline"
        >
          {t('Open')}
          <TbArrowRight className="size-4" aria-hidden />
        </Link>
      }
    >
      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : !view ? (
        <p className="text-sm text-foreground-tertiary">—</p>
      ) : (
        <div className="flex flex-col gap-3 text-sm">
          {view.awaiting_admin ? (
            <p className="text-amber-800">
              {view.awaiting_admin_reason === 'no_cleaned_points'
                ? t('No waste point was declared cleaned: the admin decides whether the campaign is completed.')
                : t('The completion was not accepted {{n}} times: the admin now decides.', { n: view.rejection_count })}
            </p>
          ) : (
            <p className="text-foreground-secondary">
              {t('{{verified}} of {{total}} meeting points verified, {{flagged}} flagged, {{rejected}} not accepted.', {
                verified: counts.verified ?? 0,
                total: points.length,
                flagged: counts.flagged ?? 0,
                rejected: counts.rejected ?? 0,
              })}
            </p>
          )}
          {points.length > 0 && (
            <ul className="flex flex-col divide-y divide-[rgba(136,122,71,0.2)]">
              {points.map((p, i) => {
                const index = (campaign.meeting_points ?? []).findIndex((m) => m.id === p.meeting_point_id);
                const trashTitle = (id: string) => {
                  const r = reportById.get(id);
                  const tp = p.trash_points.find((x) => x.report_id === id);
                  return (r && localizedTitle(r).trim()) || tp?.report?.title || t('Waste point');
                };
                return (
                  <li key={p.verification_id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <Link
                      href={`/campaigns/${campaign.id}/verify?point=${p.meeting_point_id}`}
                      className="min-w-0 truncate font-medium hover:underline"
                    >
                      {meetingPointLabel(p.name, index >= 0 ? index : i, t)}
                    </Link>
                    <span className="flex flex-wrap items-center gap-1.5 text-xs text-foreground-tertiary">
                      <Pill tone={CHECK_LEVEL_TONE[p.layer1_level]}>{t(CHECK_LEVEL_LABEL[p.layer1_level])}</Pill>
                      <span className="tabular-nums">
                        {p.up_count}↑ {p.down_count}↓{p.score != null ? ` · ${t('Score')} ${p.score}` : ''}
                      </span>
                      <MeetingPointStatusPill status={p.status} />
                    </span>
                    {p.status === 'rejected' && (p.decision_reason || p.failed_report_ids.length > 0) && (
                      <span className="flex w-full flex-col text-xs text-red-700">
                        {p.failed_report_ids.length > 0 && (
                          <span>
                            {t('Waste points that did not pass')}: {p.failed_report_ids.map(trashTitle).join(', ')}
                          </span>
                        )}
                        {p.decision_reason && (
                          <span>
                            {t('Reason')}: {p.decision_reason}
                          </span>
                        )}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </CollapsibleCard>
  );
});

export default VerificationStatusCard;
