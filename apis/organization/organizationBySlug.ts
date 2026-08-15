import requestApi from "@/utils/requestApi";
import { IGetOrganizationBySlugResponse } from "./models/organizationBySlug";
import { useGet, UseGetOptions } from "@/hooks/reactQuery";

const url = "/api/v1/organizations/by-slug";

// GET /api/v1/organizations/by-slug/{slug}
export const getOrganizationBySlug = async (
  slug: string,
): Promise<IGetOrganizationBySlugResponse> => {
  return await requestApi.get<IGetOrganizationBySlugResponse>(
    `${url}/${encodeURIComponent(slug)}`,
  );
};

export const useGetOrganizationBySlug = (
  slug: string,
  options?: Omit<
    UseGetOptions<IGetOrganizationBySlugResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  return useGet({
    queryKey: ["organization-by-slug", slug],
    queryFn: () => getOrganizationBySlug(slug),
    ...options,
  });
};
