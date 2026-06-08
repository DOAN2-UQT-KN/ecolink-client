"use client";

import { useSearchParams } from "@/libs/router";

import SignInForm from "./_components/SignInForm";

function resolveRedirect(raw: string | null): string {
  if (raw && raw.length > 0) {
    return raw;
  }
  return "/";
}

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirect = resolveRedirect(searchParams.get("redirect"));

  return <SignInForm redirect={redirect} />;
}
