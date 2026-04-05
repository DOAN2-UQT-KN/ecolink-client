"use client";

import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import useAuthStore from "@/stores/useAuthStore";

function handleGlobalError(error: any) {
  console.log("Global Error", error);
  const status = error?.status || error?.response?.status || error?.statusCode;
  if (status === 401) {
    useAuthStore.getState().setLogoutSuccess();
    if (typeof window !== "undefined") {
      const redirect = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
      window.location.href = `/sign-in?redirect=${redirect}`;
    }
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
