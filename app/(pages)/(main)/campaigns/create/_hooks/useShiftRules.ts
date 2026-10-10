import { useTranslation } from 'react-i18next';

import { useCampaign } from '../_context/CampaignContext';
import type { CampaignFormValues } from '../_services/campaignForm.service';
import {
  validateGatherTime,
  validateLeader,
  validateMaxVolunteers,
  validateMinVolunteers,
  validateMinVolunteersReason,
  validateShiftWindow,
} from '../_services/shiftSchedule.service';

const toNumber = (v: unknown) => (v === '' || v == null ? null : Number(v));

/** react-hook-form `rules` for the shift grid, with translated messages. */
export function useShiftRules() {
  const { t } = useTranslation();
  const { approvedEdit, suggestedMinPerDay } = useCampaign();
  const translated = (result: true | string) => result === true || t(result);

  return {
    min: (d: number, p: number) => ({
      setValueAs: toNumber,
      validate: (v: number | null, values: CampaignFormValues) =>
        translated(validateMinVolunteers(v, values, d, p, approvedEdit)),
    }),
    max: (d: number, p: number) => ({
      setValueAs: toNumber,
      validate: (v: number | null, values: CampaignFormValues) =>
        translated(validateMaxVolunteers(v, values, d, p)),
    }),
    gather: (d: number, p: number) => ({
      validate: (v: string, values: CampaignFormValues) =>
        translated(validateGatherTime(v, values, d, p)),
    }),
    window: (d: number, p: number) => ({
      validate: (_: string, values: CampaignFormValues) =>
        translated(validateShiftWindow(values, d, p)),
    }),
    leader: (d: number, p: number) => ({
      validate: (v: string, values: CampaignFormValues) =>
        translated(validateLeader(v, values, d, p)),
    }),
    minReason: {
      validate: (v: string, values: CampaignFormValues) =>
        translated(validateMinVolunteersReason(v, values, suggestedMinPerDay)),
    },
  };
}
