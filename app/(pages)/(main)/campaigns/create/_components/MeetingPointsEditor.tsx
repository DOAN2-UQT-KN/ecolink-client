import { memo, useMemo } from 'react';
import { Controller, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { BiTrash } from 'react-icons/bi';

import { Input } from '@/components/ui/input';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/client/shared/Button';
import { useGetMembersByOrg } from '@/apis/organization/organizationById';
import useAuthStore from '@/stores/useAuthStore';
import {
  CAMPAIGN_MEETING_POINT_MAX,
  CAMPAIGN_MEETING_POINT_MAX_DISTANCE_KM,
  haversineKm,
} from '@/constants/campaignLifecycle';

import { useCampaign } from '../_hooks/useCampaign';
import { emptyMeetingPoint } from '../_services/campaign.service';
import LeafletAddress from './LeafletAddress';
import IncidentList from './IncidentList';

const inputClassName =
  'border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50';

/**
 * 1–5 meeting points, each with its location, gathering time, slots, the manager in charge
 * and its own waste points. With a single point the multi-point options stay hidden and the
 * campaign reads like a normal one-location campaign.
 */
const MeetingPointsEditor = memo(function MeetingPointsEditor() {
  const { t } = useTranslation();
  const { form, campaign } = useCampaign();
  const { control, register, watch, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'meeting_points' });
  const currentUserId = useAuthStore((s) => s.user?.id) ?? '';
  const organizationId = watch('organization_id');
  const points = watch('meeting_points');
  const isMulti = fields.length > 1;

  const { data: membersData } = useGetMembersByOrg(
    { organization_id: organizationId, page: 1, limit: 100 },
    { enabled: Boolean(organizationId) },
  );
  const members = membersData?.data?.members ?? [];

  const warnings = useMemo(() => {
    const out: string[] = [];
    const located = points
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.latitude != null && p.longitude != null);
    for (let a = 0; a < located.length; a++) {
      for (let b = a + 1; b < located.length; b++) {
        const km = haversineKm(
          { latitude: located[a].p.latitude!, longitude: located[a].p.longitude! },
          { latitude: located[b].p.latitude!, longitude: located[b].p.longitude! },
        );
        if (km > CAMPAIGN_MEETING_POINT_MAX_DISTANCE_KM) {
          out.push(
            t('Points {{a}} and {{b}} are {{km}} km apart (max {{max}} km). Split them into separate campaigns.', {
              a: located[a].i + 1,
              b: located[b].i + 1,
              km: km.toFixed(1),
              max: CAMPAIGN_MEETING_POINT_MAX_DISTANCE_KM,
            }),
          );
        }
      }
    }
    const totalSlots = points.reduce((sum, p) => sum + (Number(p.slots) || 0), 0);
    const cap = campaign?.max_members;
    if (cap != null && totalSlots > cap) {
      out.push(
        t('Total slots ({{total}}) exceed the {{max}} volunteers allowed for this difficulty', {
          total: totalSlots,
          max: cap,
        }),
      );
    }
    return out;
  }, [campaign?.max_members, points, t]);

  const pointErrors = formState.errors.meeting_points;

  return (
    <div className="w-full flex flex-col gap-6 px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-display-5 font-semibold !text-button-accent ">
            {isMulti ? t('Meeting points') : t('Location')}
          </span>
          <span className="text-xs text-foreground-tertiary">
            {t('Up to {{max}} meeting points on the same day, within {{km}} km of each other', {
              max: CAMPAIGN_MEETING_POINT_MAX,
              km: CAMPAIGN_MEETING_POINT_MAX_DISTANCE_KM,
            })}
          </span>
        </div>
        {fields.length < CAMPAIGN_MEETING_POINT_MAX && (
          <Button
            type="button"
            variant="outlined-brown"
            onClick={() => append(emptyMeetingPoint(currentUserId))}
          >
            {t('Add meeting point')}
          </Button>
        )}
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
            {isMulti && (
              <div className="flex items-center justify-between gap-3">
                <span className="font-display-4 font-semibold">
                  {t('Meeting point {{n}}', { n: index + 1 })}
                </span>
                <button
                  type="button"
                  aria-label={t('Remove meeting point')}
                  className="text-destructive"
                  onClick={() => remove(index)}
                >
                  <BiTrash size={18} />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {isMulti && (
                <Field>
                  <FieldLabel className="text-foreground-tertiary font-display-3">
                    {t('Name')} <span className="text-destructive">*</span>
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
              )}

              <Field>
                <FieldLabel className="text-foreground-tertiary font-display-3">
                  {t('Person in charge')} <span className="text-destructive">*</span>
                </FieldLabel>
                <Controller
                  name={`meeting_points.${index}.leader_user_id`}
                  control={control}
                  rules={{ required: t('Choose who is in charge of this point') }}
                  render={({ field: f }) => (
                    <Select value={f.value || undefined} onValueChange={f.onChange}>
                      <SelectTrigger className={`${inputClassName} !h-[40px] w-full`}>
                        <SelectValue placeholder={t('Choose a member')} />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m.user_id} value={m.user_id}>
                            {m.user?.name || m.user?.email || m.user_id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors?.leader_user_id]} />
              </Field>

              <Field>
                <FieldLabel className="text-foreground-tertiary font-display-3">
                  {t('Gathering time')}
                </FieldLabel>
                <Input
                  type="time"
                  {...register(`meeting_points.${index}.gather_time`)}
                  className={inputClassName}
                />
                <FieldError errors={[errors?.gather_time]} />
              </Field>

              <Field>
                <FieldLabel className="text-foreground-tertiary font-display-3">
                  {t('Slots')}
                </FieldLabel>
                <Input
                  type="number"
                  min={1}
                  {...register(`meeting_points.${index}.slots`, {
                    setValueAs: (v) => (v === '' || v == null ? null : Number(v)),
                    validate: (v) =>
                      v == null || (Number.isInteger(v) && v >= 1) ||
                      t('Slots must be a positive whole number'),
                  })}
                  placeholder={t('No limit')}
                  className={inputClassName}
                />
                <FieldError errors={[errors?.slots]} />
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
    </div>
  );
});

export default MeetingPointsEditor;
