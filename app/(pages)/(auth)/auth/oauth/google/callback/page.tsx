import { Suspense } from "react";
import PageSuspense from "@/components/client/shared/PageSuspense";
import GoogleCallbackView from "@/app/(pages)/(auth)/google-callback/_components/GoogleCallbackView";

export default function GoogleOauthCallbackPage() {
  return (
    <Suspense fallback={<PageSuspense pageName="google-callback" />}>
      <GoogleCallbackView />
    </Suspense>
  );
}
