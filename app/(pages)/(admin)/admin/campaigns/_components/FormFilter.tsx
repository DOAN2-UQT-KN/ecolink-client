'use client';

import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SelectListOrganization from '@/components/form/SelectListOrganization';
import { STATUS } from '@/constants/status';
import { useCampaignContext } from '../_context/CampaignContext';

/** Status options relevant to campaigns — derived from STATUS enum */
const CAMPAIGN_STATUS_OPTIONS = [
  { labelKey: 'All', value: 'all' },
  { labelKey: 'Active', value: String(STATUS.ACTIVE) },
  { labelKey: 'Inactive', value: String(STATUS.INACTIVE) },
  { labelKey: 'Pending', value: String(STATUS.PENDING) },
  // { labelKey: "Verified", value: String(STATUS.VERIFIED) },
  // { labelKey: "Rejected", value: String(STATUS.REJECTED) },
  { labelKey: 'Completed', value: String(STATUS.COMPLETED) },
] as const;

export const FormFilter = memo(function FormFilter() {
  const { t } = useTranslation();
  const { filters, onFilterChange } = useCampaignContext();

  const handleStatusChange = useCallback(
    (value: string) => {
      onFilterChange({ status: value });
    },
    [onFilterChange],
  );

  const handleOrganizationChange = useCallback(
    (value: string) => {
      // treat the "clear" sentinel ("") as no filter
      onFilterChange({ organizationId: value });
    },
    [onFilterChange],
  );

  const statusOptions = useMemo(
    () => CAMPAIGN_STATUS_OPTIONS.map((opt) => ({ ...opt, label: t(opt.labelKey) })),
    [t],
  );

  return (
    <div className="space-y-4 rounded-[10px] border border-zinc-200 bg-card p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Status filter */}
        <Field>
          <FieldLabel className="text-sm font-medium text-foreground-secondary">
            {t('Status')}
          </FieldLabel>
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="!h-10 w-full !border !border-zinc-300">
              <SelectValue placeholder={t('Select status')} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* Organization filter */}
        <Field>
          <FieldLabel className="text-sm font-medium text-foreground-secondary">
            {t('Organization')}
          </FieldLabel>
          <SelectListOrganization
            value={filters.organizationId || undefined}
            onChange={handleOrganizationChange}
            className="!h-10 !border !border-zinc-300"
          />
        </Field>
      </div>
    </div>
  );
});

export default FormFilter;
