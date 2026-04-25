"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageSuspense from "@/components/client/shared/PageSuspense";
import { getMe } from "@/apis/auth/getMe";
import { googleCallback } from "@/apis/auth/googleCallback";
import useAuthStore from "@/stores/useAuthStore";
import { handleSignInSuccess } from "@/app/(pages)/(auth)/sign-in/_services/auth.service";

export default function GoogleCallbackView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledRef = useRef(false);

  const handleCallback = useCallback(async () => {
    if (handledRef.current) {
      return;
    }
    handledRef.current = true;

    const code = searchParams.get("code");
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (error) {
      router.push(`/sign-in?error=${error}`);
      return;
    }

    if (code) {
      try {
        const res = await googleCallback(code);
        handleSignInSuccess(res, router, "/");
      } catch {
        router.push("/sign-in?error=google_oauth_failed");
      }
      return;
    }

    if (success === "true") {
      try {
        const res = await getMe();
        if (res.data?.user) {
          useAuthStore.getState().setUser(res.data.user);
          useAuthStore.getState().setIsAuthenticated(true);
        }
      } catch {
        // Cookie might be set but user fetch failed, still redirect to home
      }
      router.push("/");
      return;
    }

    router.push("/sign-in?error=google_oauth_failed");
  }, [searchParams, router]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  return <PageSuspense pageName="google-callback" />;
}
