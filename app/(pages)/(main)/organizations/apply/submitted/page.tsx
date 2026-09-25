import { useTranslation } from "react-i18next";
import {
  TbBuildingCommunity,
  TbCircleCheck,
  TbFileSearch,
  TbMailCheck,
} from "react-icons/tb";

import { useGetApplication } from "@/apis/organization-application/getApplication";
import { BreadcrumbItemProps } from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/client/shared/Button";
import { Link, useSearchParams } from "@/libs/router";
import ApplicationDetails from "../_components/ApplicationDetails";
import {
  ApplicationDetailsSkeleton,
  ApplicationNotFound,
  ApplicationPageLayout,
} from "../_components/ApplicationPageLayout";

// `Breadcrumbs` runs every label through `t()` itself, so these stay raw English.
const breadcrumbs: BreadcrumbItemProps[] = [
  { label: "Home", path: "/", type: "link" },
  { label: "Organizations", path: "/organizations", type: "link" },
  { label: "Submitted", path: "/organizations/apply/submitted", type: "page" },
];

const NEXT_STEPS = [
  {
    icon: TbMailCheck,
    title: "Check your inbox",
    description:
      "We emailed you a tracking link. Keep it — it is the only way to follow this application.",
  },
  {
    icon: TbFileSearch,
    title: "We review your paperwork",
    description:
      "A reviewer checks your documents and may ask you to add what is missing.",
  },
  {
    icon: TbBuildingCommunity,
    title: "Your organization goes live",
    description:
      "Once approved, we email you a link to activate the organization's account.",
  },
];

/**
 * Landing page right after a submission. The submit response carries the same tracking
 * token the acknowledgement mail does, so the whole application is shown straight away and
 * survives a refresh.
 */
export default function ApplicationSubmittedPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const token = searchParams.get("token") ?? "";

  const { data, isLoading, isError } = useGetApplication({ id, token });
  const application = data?.data?.application;
  const trackingPath = `/organizations/apply/status/${encodeURIComponent(
    id,
  )}?token=${encodeURIComponent(token)}`;

  return (
    <ApplicationPageLayout breadcrumbs={breadcrumbs}>
      <div className="flex items-start gap-3 rounded-[10px] bg-background-secondary/30 p-4">
        <TbCircleCheck className="mt-0.5 size-6 shrink-0 text-background-quaternary" />
        <div className="flex flex-col gap-1">
          {/* h2, not h1: the global `h1` rule in globals.css forces the Playfair title font. */}
          <h2 className="font-display-4 font-semibold text-foreground">
            {t("We received your application")}
          </h2>
          <p className="text-sm text-foreground-secondary">
            {t(
              "A reviewer will look at your paperwork. We emailed you a tracking link — keep it, you need it to follow the review, add missing documents or withdraw the application.",
            )}
          </p>
        </div>
      </div>

      {!id || !token || isError ? (
        <ApplicationNotFound
          message={t("This tracking link is invalid or has expired.")}
        />
      ) : isLoading || !application ? (
        <ApplicationDetailsSkeleton />
      ) : (
        <ApplicationDetails application={application} trackingToken={token} />
      )}

      <div className="flex flex-col gap-3 border-t border-[rgba(136,122,71,0.3)] pt-6">
        <h3 className="font-semibold">{t("What happens next")}</h3>
        <ol className="grid gap-4 sm:grid-cols-3">
          {NEXT_STEPS.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[rgba(136,122,71,0.1)]">
                <Icon className="size-5 text-button-accent" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{t(title)}</span>
                <span className="text-sm text-foreground-tertiary">
                  {t(description)}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/">
          <Button variant="outlined-brown" className="w-full sm:w-auto">
            {t("Back to home")}
          </Button>
        </Link>
        <Link href="/organizations">
          <Button variant="outlined-brown" className="w-full sm:w-auto">
            {t("Browse organizations")}
          </Button>
        </Link>
        {application && (
          <Link href={trackingPath}>
            <Button variant="brown" className="w-full sm:w-auto">
              {t("Open tracking page")}
            </Button>
          </Link>
        )}
      </div>
    </ApplicationPageLayout>
  );
}
