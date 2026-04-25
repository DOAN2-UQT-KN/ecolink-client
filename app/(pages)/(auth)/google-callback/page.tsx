import { Suspense } from "react";
import GoogleCallbackView from "./_components/GoogleCallbackView";
import PageSuspense from "@/components/client/shared/PageSuspense";

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<PageSuspense pageName="google-callback" />}>
      <GoogleCallbackView />
    </Suspense>
  );
}
