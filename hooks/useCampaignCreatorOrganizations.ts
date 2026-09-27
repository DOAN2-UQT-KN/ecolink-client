import { useMemo } from 'react';

import { useGetMyOrganizations } from '@/apis/organization/getMyOrganizations';
import type { IGetMyOrganizationsRequest } from '@/apis/organization/models/getMyOrganizations';
import type { OrgMemberRole } from '@/apis/organization/models/organization';

/** Org roles allowed to create campaigns (server `OrgPermission.CAMPAIGN_CREATE`). */
export const CAMPAIGN_CREATOR_ROLES: OrgMemberRole[] = [
  'LEGAL_REPRESENTATIVE',
  'OWNER',
  'CAMPAIGN_MANAGER',
];

export const ALL_ORG_MEMBER_ROLES: OrgMemberRole[] = [
  'LEGAL_REPRESENTATIVE',
  'OWNER',
  'ADMIN',
  'CAMPAIGN_MANAGER',
  'MEMBER',
];

/**
 * Params of the "my organizations" list behind `SelectListOrganization`. Shared so other callers
 * with the same `roles` hit the same React Query cache entry. Without `roles` it keeps the legacy
 * `is_owner: true` filter.
 */
export const buildMyOrganizationsSelectParams = (
  roles?: OrgMemberRole[],
): IGetMyOrganizationsRequest => ({
  page: 1,
  limit: 100,
  ...(roles?.length ? { roles } : { is_owner: true }),
  sort_by: 'created_at',
  sort_order: 'desc',
});

/** Organizations where the viewer may create a campaign (`permissions.can_create_campaign`). */
export const useCampaignCreatorOrganizations = (options?: { enabled?: boolean }) => {
  const params = useMemo(() => buildMyOrganizationsSelectParams(CAMPAIGN_CREATOR_ROLES), []);
  const { data, isLoading } = useGetMyOrganizations(params, {
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  });

  const organizations = useMemo(
    () => (data?.data?.organizations ?? []).filter((org) => org.permissions?.can_create_campaign),
    [data?.data?.organizations],
  );

  return { organizations, isLoading };
};
