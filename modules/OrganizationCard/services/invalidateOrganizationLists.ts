import type { QueryClient } from "@tanstack/react-query";

export function invalidateOrganizationListsQuery(
  queryClient: QueryClient,
): void {
  void queryClient.invalidateQueries({ queryKey: ["organizations"] });
}
