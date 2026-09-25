import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "@/libs/router";
import { Button } from "@/components/client/shared/Button";

/**
 * Where incident-service redirects when a contact-email verification link fails. The success
 * path goes straight to the organization page instead, so this only ever shows an error.
 */
const REASON_MESSAGES: Record<string, string> = {
  invalid_or_expired:
    "This verification link is invalid or has expired. Ask the organization to send a new one.",
  mismatch:
    "This link no longer matches the organization's contact email. Ask for a new verification email.",
  not_found: "We could not find the organization this link points to.",
};

export default function OrganizationEmailVerifiedPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const reason = searchParams.get("error") ?? "";

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-5 py-10">
      <h1 className="font-display-6 font-semibold !text-button-accent">
        {t("Email verification")}
      </h1>
      <p className="text-foreground-tertiary">
        {t(REASON_MESSAGES[reason] ?? REASON_MESSAGES.invalid_or_expired)}
      </p>
      <Link href="/organizations">
        <Button variant="outlined-brown">{t("Browse organizations")}</Button>
      </Link>
    </div>
  );
}
