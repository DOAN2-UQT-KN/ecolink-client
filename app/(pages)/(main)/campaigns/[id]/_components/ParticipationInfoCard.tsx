import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ICampaign } from '@/apis/campaign/models/campaign';
import { SummaryRow } from '@/app/(pages)/(main)/organizations/apply/_components/ApplicationDetails';
import { impliedMinAge } from '@/app/(pages)/(main)/campaigns/create/_services/campaign.service';
import { cn } from '@/libs/utils';

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
    <div className={cn('rounded-xl border border-[rgba(136,122,71,0.4)] bg-white/60 p-5 sm:p-6 shadow-sm', className)}>
      <h2 className="font-display-6 font-semibold text-button-accent mb-4">
        {t('Participation info')}
      </h2>
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
    </div>
  );
});

export default ParticipationInfoCard;
