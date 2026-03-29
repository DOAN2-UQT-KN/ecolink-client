"use client";

import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import useAuthStore from "@/stores/useAuthStore";

function handleGlobalError(error: any) {
  if (error?.status === 401) {
    useAuthStore.getState().setLogoutSuccess();
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleGlobalError }),
  mutationCache: new MutationCache({ onError: handleGlobalError }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
