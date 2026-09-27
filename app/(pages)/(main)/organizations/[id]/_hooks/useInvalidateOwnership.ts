import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { invalidateOrganizationListsQuery } from "@/modules/OrganizationCard/services/invalidateOrganizationLists";
import { useOrganizationDetail } from "./useOrganizationDetail";

/** Refetch everything an owner change can affect: the organization, members, open changes. */
export const useInvalidateOwnership = () => {
  const queryClient = useQueryClient();
  const { organizationSlug, organizationId } = useOrganizationDetail();
  return useCallback(() => {
    invalidateOrganizationListsQuery(queryClient);
    void queryClient.invalidateQueries({ queryKey: ["organization-by-slug", organizationSlug] });
    void queryClient.invalidateQueries({ queryKey: ["organization", organizationId] });
    void queryClient.invalidateQueries({ queryKey: ["organization-members"] });
    void queryClient.invalidateQueries({ queryKey: ["organization-owner-changes"] });
  }, [queryClient, organizationSlug, organizationId]);
};
