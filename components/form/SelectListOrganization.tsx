'use client';

import Image from 'next/image';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useGetMyOrganizations } from '@/apis/organization/getMyOrganizations';
import { IOrganization } from '@/apis/organization/models/organization';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export const ALL_ORGANIZATIONS_VALUE = '-1';

interface SelectListOrganizationProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  /** When true, prepends an "All" option with value "-1" so the parent can detect "no filter". Default: false. */
  allOptions?: boolean;
}

const SelectListOrganization = memo(function SelectListOrganization({
  value,
  onChange,
  disabled = false,
  allOptions = false,
  ...props
}: SelectListOrganizationProps) {
  const { t } = useTranslation();

  const params = useMemo(
    () => ({
      page: 1,
      limit: 100,
      is_owner: true,
      sort_by: 'created_at' as const,
      sort_order: 'desc' as const,
    }),
    [],
  );

  const { data, isLoading } = useGetMyOrganizations(params, {
    staleTime: 60_000,
  });

  const organizations = useMemo(() => data?.data?.organizations ?? [], [data?.data?.organizations]);

  const isAll = value === ALL_ORGANIZATIONS_VALUE;

  const selectedOrganization = useMemo(
    () => (isAll ? undefined : organizations.find((org) => org.id === value)),
    [isAll, organizations, value],
  );

  if (isLoading) {
    return <Skeleton className="h-[50px] w-full rounded-md" />;
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className="w-full border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50"
        {...props}
      >
        <SelectValue
          placeholder={t('Select organization...')}
          aria-label={isAll ? t('All') : selectedOrganization?.name || t('Organization')}
        >
          {isAll ? (
            <span className="text-sm">{t('All organizations')}</span>
          ) : selectedOrganization ? (
            <OrganizationOption organization={selectedOrganization} />
          ) : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {allOptions && (
          <SelectItem value={ALL_ORGANIZATIONS_VALUE}>
            <span className="text-sm">{t('All organizations')}</span>
          </SelectItem>
        )}
        {organizations.map((organization) => (
          <SelectItem key={organization.id} value={organization.id}>
            <OrganizationOption organization={organization} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

const OrganizationOption = memo(function OrganizationOption({
  organization,
}: {
  organization: IOrganization;
}) {
  const fallback = useMemo(
    () => organization.name?.slice(0, 1).toUpperCase() || '?',
    [organization.name],
  );

  return (
    <div className="flex items-center gap-3 justify-start">
      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0">
        {organization.logo_url ? (
          <Image
            src={organization.logo_url}
            alt={organization.name}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
            {fallback}
          </div>
        )}
      </div>
      <div className="flex flex-col leading-tight justify-center items-start">
        <span className="text-sm font-medium">{organization.name}</span>
        <span className="text-xs text-muted-foreground">{organization.contact_email || '-'}</span>
      </div>
    </div>
  );
});

export default SelectListOrganization;
