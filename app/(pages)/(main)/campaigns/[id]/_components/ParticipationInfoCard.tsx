import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ICampaign } from '@/apis/campaign/models/campaign';
import { SummaryRow } from '@/app/(pages)/(main)/organizations/apply/_components/ApplicationDetails';
import { impliedMinAge } from '@/app/(pages)/(main)/campaigns/create/_services/campaign.service';
import { CollapsibleCard } from '@/components/client/shared/CollapsibleCard';

/** Contact, safety notes and participation conditions; empty rows hidden, nothing when all are. */
export const ParticipationInfoCard = memo(function ParticipationInfoCard({
  campaign,
  className,
}: {
  campaign: ICampaign;
  className?: string;
}) {
  const { t } = useTranslation('common');
  const requirements = campaign.requirements;
  const minAge = requirements?.min_age ?? impliedMinAge(campaign.difficulty ?? 0);
  const conditions = [
    minAge != null ? t('From {{age}} years old', { age: minAge }) : null,
    requirements?.skills?.length
      ? `${t('Required skills')}: ${requirements.skills.join(', ')}`
      : null,
    requirements?.bring_own_tools ? t('Volunteers bring their own tools') : null,
  ].filter((c): c is string => Boolean(c));
  const contact = campaign.contact_name
    ? `${campaign.contact_name}${campaign.contact_phone ? ` · ${campaign.contact_phone}` : ''}`
    : campaign.contact_phone || null;

  if (!contact && !campaign.safety_notes && conditions.length === 0) return null;

  return (
    <CollapsibleCard title={t('Participation info')} className={className}>
      <div className="flex flex-col gap-3">
        {contact && <SummaryRow label={t('Contact person')} value={contact} />}
        {campaign.safety_notes && (
          <SummaryRow
            label={t('Safety notes')}
            value={<span className="whitespace-pre-line">{campaign.safety_notes}</span>}
          />
        )}
        {conditions.length > 0 && (
          <SummaryRow
            label={t('Participation conditions')}
            value={
              <ul className="ml-5 list-disc">
                {conditions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            }
          />
        )}
      </div>
    </CollapsibleCard>
  );
});

export default ParticipationInfoCard;
