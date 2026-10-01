import { memo } from 'react';
import { useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { BiTrash } from 'react-icons/bi';

import { Input } from '@/components/ui/input';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { Button } from '@/components/client/shared/Button';
import {
  CAMPAIGN_MEETING_POINT_MAX,
  CAMPAIGN_MEETING_POINT_MAX_DISTANCE_KM,
} from '@/constants/campaignLifecycle';

import { useCampaign } from '../_hooks/useCampaign';
import { useMeetingPointWarnings } from '../_hooks/useMeetingPointWarnings';
import { emptyMeetingPoint } from '../_services/campaign.service';
import LeafletAddress from './LeafletAddress';
import IncidentList from './IncidentList';

const inputClassName =
  'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50';

/**
 * 1–5 meeting points, each with its location and its own waste points. Slots, gathering time
 * and the person in charge are set per day on the Shifts step. There is always at least one
 * point; a name is required once there are several.
 */
const MeetingPointsEditor = memo(function MeetingPointsEditor() {
  const { t } = useTranslation();
  const { form, addScheduleColumn, removeScheduleColumn } = useCampaign();
  const { control, register, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'meeting_points' });
  const isMulti = fields.length > 1;

  const warnings = useMeetingPointWarnings(form.watch('meeting_points'));

  const pointErrors = formState.errors.meeting_points;

  return (
    <div className="w-full flex flex-col gap-6 px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-display-5 font-semibold !text-button-accent ">
            {t('Meeting points')}
          </span>
          <InfoTooltip
            content={t('Up to {{max}} meeting points, within {{km}} km of each other', {
              max: CAMPAIGN_MEETING_POINT_MAX,
              km: CAMPAIGN_MEETING_POINT_MAX_DISTANCE_KM,
            })}
          />
        </div>
      </div>

      {warnings.map((w) => (
        <p key={w} role="status" className="text-sm font-medium text-amber-700">
          {w}
        </p>
      ))}

      {fields.map((field, index) => {
        const errors = pointErrors?.[index];
        return (
          <div
            key={field.id}
            className="flex flex-col gap-5 rounded-[10px] border border-[rgba(136,122,71,0.3)] p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-display-4 font-semibold">
                {t('Meeting point {{n}}', { n: index + 1 })}
              </span>
              {isMulti && (
                <button
                  type="button"
                  aria-label={t('Remove meeting point')}
                  className="text-destructive"
                  onClick={() => {
                    remove(index);
                    removeScheduleColumn(index);
                  }}
                >
                  <BiTrash size={18} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel className="text-foreground-tertiary font-display-3">
                  {t('Name')} {isMulti && <span className="text-destructive">*</span>}
                </FieldLabel>
                <Input
                  {...register(`meeting_points.${index}.name`, {
                    validate: (v) =>
                      form.getValues('meeting_points').length < 2 ||
                      Boolean(v.trim()) ||
                      t('Name each meeting point'),
                  })}
                  maxLength={120}
                  placeholder={t('e.g. Gate A')}
                  className={inputClassName}
                />
                <FieldError errors={[errors?.name]} />
              </Field>

              <Field>
                <FieldLabel className="text-foreground-tertiary font-display-3">
                  {t('Radius (km)')}
                </FieldLabel>
                <Input
                  type="number"
                  step="0.1"
                  min={0.1}
                  {...register(`meeting_points.${index}.radius_km`, {
                    valueAsNumber: true,
                    validate: (v) => v > 0 || t('Radius must be greater than 0'),
                  })}
                  className={inputClassName}
                />
                <FieldError errors={[errors?.radius_km]} />
              </Field>
            </div>

            <div className="flex flex-col md:flex-row gap-[20px] w-full md:items-start">
              <div className="w-full md:w-1/2">
                <LeafletAddress index={index} title={t('Location')} />
                <FieldError errors={[errors?.latitude]} />
              </div>
              <div className="w-full md:w-1/2">
                <IncidentList index={index} />
              </div>
            </div>
          </div>
        );
      })}

      {fields.length < CAMPAIGN_MEETING_POINT_MAX && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outlined-brown"
            onClick={() => {
              append(emptyMeetingPoint());
              addScheduleColumn();
            }}
          >
            {t('Add meeting point')}
          </Button>
        </div>
      )}
    </div>
  );
});

export default MeetingPointsEditor;
