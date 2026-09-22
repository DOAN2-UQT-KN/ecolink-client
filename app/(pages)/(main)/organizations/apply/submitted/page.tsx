import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "@/libs/router";
import { Button } from "@/components/client/shared/Button";

/**
 * Landing page right after a submission. The same tracking link also goes out by email, so
 * this page only has to reassure and hand over the code.
 */
export default function ApplicationSubmittedPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-5 py-10">
      <h1 className="font-display-6 font-semibold !text-button-accent">
        {t("We received your application")}
      </h1>
      <p className="text-foreground-tertiary">
        {t(
          "A reviewer will look at your paperwork. We emailed you a tracking link — keep it, you need it to follow the review, add missing documents or withdraw the application.",
        )}
      </p>
      {code && (
        <div className="rounded-md border border-[rgba(136,122,71,0.5)] px-4 py-3">
          <p className="text-sm text-foreground-tertiary">
            {t("Tracking code")}
          </p>
          <p className="font-display-4 font-semibold">{code}</p>
        </div>
      )}
      <Link href="/organizations">
        <Button variant="outlined-brown">{t("Browse organizations")}</Button>
      </Link>
    </div>
  );
}
