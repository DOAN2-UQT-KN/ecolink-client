import { memo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import Image from '@/components/ui/AppImage';
import { RichTextContent } from '@/components/ui/RichTextContent';
import { useGetMembersByOrg } from '@/apis/organization/organizationById';
import { getDifficultyLevel } from '@/constants/difficulty';
import { useImagePreviewSrc } from '@/libs/useImagePreviewSrc';
import { SummaryRow } from '@/app/(pages)/(main)/organizations/apply/_components/ApplicationDetails';

import { useMeetingPointWarnings } from '../_hooks/useMeetingPointWarnings';
import { ShiftSlotsTable } from '@/components/client/shared/ShiftSlotsTable';
import { useDayLabel } from './StepShifts';
import type { CampaignStep } from '../_context/CampaignContext';
import { impliedMinAge, type CampaignFormValues } from '../_services/campaign.service';

const Section = memo(function Section({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: CampaignStep;
  onEdit?: (step: CampaignStep) => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col gap-3 rounded-md border border-[rgba(136,122,71,0.35)] p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {onEdit && (
          <button
            type="button"
            className="text-sm text-button-accent underline"
            onClick={() => onEdit(step)}
          >
            {t('Edit')}
          </button>
        )}
      </div>
      {children}
    </section>
  );
});

/**
 * Everything the admin will see about a campaign, by wizard step. With `onEdit`, each section
 * has an "Edit" link back to its step (the wizard's review step, or a draft's overview page).
 */
export const CampaignSummary = memo(function CampaignSummary({
  values,
  organizationName,
  suggestedMinPerDay,
  onEdit,
}: {
  values: CampaignFormValues;
  organizationName?: string | null;
  suggestedMinPerDay?: number | null;
  onEdit?: (step: CampaignStep) => void;
}) {
  const { t } = useTranslation();
  const dayLabel = useDayLabel();
  const warnings = useMeetingPointWarnings(values.meeting_points);
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
  const pointName = (index: number) =>
    values.meeting_points[index]?.name?.trim() || t('Meeting point {{n}}', { n: index + 1 });
  const minAge = values.min_age ?? impliedMinAge(values.difficulty);
  const conditions = [
    minAge != null ? t('From {{age}} years old', { age: minAge }) : null,
    values.skills.trim() ? `${t('Required skills')}: ${values.skills.trim()}` : null,
    values.bring_own_tools ? t('Volunteers bring their own tools') : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <Section title={t('General information')} step="general" onEdit={onEdit}>
        <SummaryRow label={t('Organization')} value={organizationName} />
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

      <Section title={t('Time and contact')} step="schedule" onEdit={onEdit}>
        <SummaryRow
          label={t('Campaign schedule')}
          value={
            <ul className="flex flex-col gap-0.5">
              {values.days.map((day, index) => (
                <li key={index}>
                  {dayLabel(day, index)} · {day.start_time} – {day.end_time}
                </li>
              ))}
            </ul>
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

      <Section title={t('Meeting points')} step="meeting_points" onEdit={onEdit}>
        {values.meeting_points.map((point, index) => (
          <div key={index} className="flex flex-col gap-1">
            <span className="text-sm font-semibold">
              {point.name || t('Meeting point {{n}}', { n: index + 1 })}
            </span>
            <SummaryRow label={t('Location')} value={point.detail_address} />
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

      <Section title={t('Shifts')} step="shifts" onEdit={onEdit}>
        <ShiftSlotsTable
          days={values.days.map((day, index) => ({
            label: dayLabel(day, index),
            hours: `${day.start_time || '—'} – ${day.end_time || '—'}`,
          }))}
          points={values.meeting_points.map((_, index) => pointName(index))}
          cells={values.schedule.map((row, d) =>
            row.map((cell) => ({
              hours: `${cell.start_time || values.days[d]?.start_time || '—'} – ${cell.end_time || values.days[d]?.end_time || '—'}`,
              minVolunteers: cell.min_volunteers,
              maxVolunteers: cell.max_volunteers,
              gatherTime: cell.gather_time,
              leader: cell.leader_user_id ? memberName(cell.leader_user_id) : null,
            })),
          )}
          suggestedMinPerDay={suggestedMinPerDay}
        />
        {values.min_volunteers_reason?.trim() && (
          <SummaryRow
            label={t('Why fewer volunteers than suggested')}
            value={values.min_volunteers_reason}
          />
        )}
      </Section>
    </div>
  );
});

export default CampaignSummary;
