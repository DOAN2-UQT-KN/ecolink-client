import { memo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import Image from '@/components/ui/AppImage';
import { RichTextContent } from '@/components/ui/RichTextContent';
import { useGetMembersByOrg } from '@/apis/organization/organizationById';
import { getDifficultyLevel } from '@/constants/difficulty';
import { useImagePreviewSrc } from '@/libs/useImagePreviewSrc';
import { SummaryRow } from '@/app/(pages)/(main)/organizations/apply/_components/ApplicationDetails';

import { useCampaign } from '../_hooks/useCampaign';
import { useMeetingPointWarnings } from '../_hooks/useMeetingPointWarnings';
import { CAMPAIGN_STEPS, type CampaignStep } from '../_context/CampaignContext';
import { impliedMinAge } from '../_services/campaign.service';

const Section = memo(function Section({
  title,
  step,
  children,
}: {
  title: string;
  step: CampaignStep;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { goToStep } = useCampaign();
  return (
    <section className="flex flex-col gap-3 rounded-md border border-[rgba(136,122,71,0.35)] p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <button
          type="button"
          className="text-sm text-button-accent underline"
          onClick={() => goToStep(CAMPAIGN_STEPS.indexOf(step))}
        >
          {t('Edit')}
        </button>
      </div>
      {children}
    </section>
  );
});

/** Step 4: everything the admin will see, with a way back to each step. */
const StepReview = memo(function StepReview() {
  const { t } = useTranslation();
  const { form, organization } = useCampaign();
  const values = form.watch();
  const warnings = useMeetingPointWarnings();
  const bannerSrc = useImagePreviewSrc(values.banner);
  const { data: membersData } = useGetMembersByOrg(
    { organization_id: values.organization_id, page: 1, limit: 100 },
    { enabled: Boolean(values.organization_id) },
  );
  const memberName = (userId: string) => {
    const member = membersData?.data?.members?.find((m) => m.user_id === userId);
    return member?.user?.name || member?.user?.email || '—';
  };

  const difficulty = getDifficultyLevel(values.difficulty);
  const day = values.campaign_date ? new Date(`${values.campaign_date}T00:00:00`) : null;
  const minAge = values.min_age ?? impliedMinAge(values.difficulty);
  const conditions = [
    minAge != null ? t('From {{age}} years old', { age: minAge }) : null,
    values.skills.trim() ? `${t('Required skills')}: ${values.skills.trim()}` : null,
    values.bring_own_tools ? t('Volunteers bring their own tools') : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display-5 font-semibold !text-button-accent">
        {t('Review & submit')}
      </h2>

      <Section title={t('General information')} step="general">
        <SummaryRow label={t('Organization')} value={organization?.name} />
        <SummaryRow label={t('Title')} value={values.title} />
        <SummaryRow label={t('Difficulty')} value={difficulty ? t(difficulty.label) : null} />
        <SummaryRow
          label={t('Description')}
          value={<RichTextContent value={values.description} maxLines={4} />}
        />
        <SummaryRow
          label={t('Banner')}
          value={
            bannerSrc ? (
              <Image
                src={bannerSrc}
                alt={values.title}
                width={160}
                height={90}
                className="h-[90px] w-[160px] rounded-md object-cover"
              />
            ) : null
          }
        />
      </Section>

      <Section title={t('Time and contact')} step="schedule">
        <SummaryRow
          label={t('Campaign schedule')}
          value={
            day ? `${format(day, 'PPP')} · ${values.start_time} – ${values.end_time}` : null
          }
        />
        <SummaryRow
          label={t('Contact person')}
          value={
            values.contact_name
              ? `${values.contact_name}${values.contact_phone ? ` · ${values.contact_phone}` : ''}`
              : null
          }
        />
        <SummaryRow label={t('Safety notes')} value={values.safety_notes} />
        <SummaryRow label={t('Participation conditions')} value={conditions.join(' · ')} />
      </Section>

      <Section title={t('Meeting points')} step="meeting_points">
        {values.meeting_points.map((point, index) => (
          <div key={index} className="flex flex-col gap-1">
            {values.meeting_points.length > 1 && (
              <span className="text-sm font-semibold">
                {point.name || t('Meeting point {{n}}', { n: index + 1 })}
              </span>
            )}
            <SummaryRow label={t('Location')} value={point.detail_address} />
            <SummaryRow label={t('Person in charge')} value={point.leader_user_id ? memberName(point.leader_user_id) : null} />
            <SummaryRow label={t('Gathering time')} value={point.gather_time} />
            <SummaryRow label={t('Slots')} value={point.slots ?? t('No limit')} />
            <SummaryRow
              label={t('Waste points')}
              value={`${point.reports.length} · ${t('within {{km}} km', { km: point.radius_km })}`}
            />
          </div>
        ))}
        {warnings.map((w) => (
          <p key={w} role="status" className="text-sm font-medium text-amber-700">
            {w}
          </p>
        ))}
      </Section>
    </div>
  );
});

export default StepReview;
