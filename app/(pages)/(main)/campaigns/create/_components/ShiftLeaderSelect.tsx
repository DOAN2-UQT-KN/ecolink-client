import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useCampaign } from '../_context/CampaignContext';
import { useShiftRules } from '../_hooks/useShiftRules';
import type { IMember } from '@/apis/organization/models/organizationMembers';
import { inputClassName } from '../_services/fieldStyles';

/** Who leads shift `d`.`p`; only the campaign's team may (spec 3.4). */
export default function ShiftLeaderSelect({
  d,
  p,
  members,
  disabled = false,
}: {
  d: number;
  p: number;
  members: IMember[];
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { form } = useCampaign();
  const rules = useShiftRules();

  return (
    <Controller
      name={`schedule.${d}.${p}.leader_user_id`}
      control={form.control}
      rules={rules.leader(d, p)}
      render={({ field }) => (
        <Select value={field.value || undefined} onValueChange={field.onChange} disabled={disabled}>
          <SelectTrigger className={`${inputClassName} !h-[50px] w-full min-w-[180px]`}>
            <SelectValue placeholder={t('Choose a manager')} />
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
  );
}
