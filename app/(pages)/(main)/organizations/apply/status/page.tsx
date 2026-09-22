import { useTranslation } from "react-i18next";

import {
  useGetApplication,
} from "@/apis/organization-application/getApplication";
import { useWithdrawApplication } from "@/apis/organization-application/createApplication";
import type { ApplicationStatus } from "@/apis/organization-application/models/application";
import { Button } from "@/components/client/shared/Button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams, useSearchParams } from "@/libs/router";
import { queryClient } from "@/libs/queryClient";
import { cn } from "@/libs/utils";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Waiting for review",
  UNDER_REVIEW: "Under review",
  NEEDS_MORE_INFO: "More information needed",
  APPROVED: "Approved",
  REJECTED: "Not approved",
  WITHDRAWN: "Withdrawn",
};

const STATUS_TONES: Record<ApplicationStatus, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700",
  SUBMITTED: "bg-amber-100 text-amber-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  NEEDS_MORE_INFO: "bg-orange-100 text-orange-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  WITHDRAWN: "bg-zinc-100 text-zinc-700",
};

const OPEN_STATUSES: ApplicationStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "NEEDS_MORE_INFO",
];

/**
 * Behind the tracking link emailed to the applicant. The `token` in the URL is the only
 * credential — there is no account to log into — so it is passed on to every call here.
 */
export default function ApplicationStatusPage() {
  const { t } = useTranslation();
  const params = useParams();
  const searchParams = useSearchParams();

  const id = String(params.id ?? "");
  const token = searchParams.get("token") ?? "";

  const { data, isLoading, isError } = useGetApplication({ id, token });
  const application = data?.data?.application;

  const { mutate: withdraw, isPending: isWithdrawing } =
    useWithdrawApplication({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["organization-application", id, token],
        });
      },
    });

  if (!token) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <p className="text-foreground-tertiary">
          {t("This link is missing its tracking token.")}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 py-10">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError || !application) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-4 py-10">
        <h1 className="font-display-6 font-semibold !text-button-accent">
          {t("Application not found")}
        </h1>
        <p className="text-foreground-tertiary">
          {t("This tracking link is invalid or has expired.")}
        </p>
        <Link href="/organizations">
          <Button variant="outlined-brown">{t("Browse organizations")}</Button>
        </Link>
      </div>
    );
  }

  const canWithdraw = OPEN_STATUSES.includes(application.status);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-10">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display-6 font-semibold !text-button-accent">
            {application.profile?.name}
          </h1>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              STATUS_TONES[application.status],
            )}
          >
            {t(STATUS_LABELS[application.status])}
          </span>
        </div>
        <p className="text-sm text-foreground-tertiary">
          {t("Tracking code")}: <strong>{application.code}</strong>
        </p>
      </header>

      {application.status === "NEEDS_MORE_INFO" && application.review_note && (
        <section className="rounded-md border border-orange-200 bg-orange-50 p-4">
          <h2 className="font-semibold text-orange-900">
            {t("A reviewer asked for more information")}
          </h2>
          <p className="mt-1 whitespace-pre-line text-sm text-orange-900">
            {application.review_note}
          </p>
        </section>
      )}

      {application.status === "REJECTED" && application.reject_reason && (
        <section className="rounded-md border border-red-200 bg-red-50 p-4">
          <h2 className="font-semibold text-red-900">
            {t("Why it was not approved")}
          </h2>
          <p className="mt-1 whitespace-pre-line text-sm text-red-900">
            {application.reject_reason}
          </p>
        </section>
      )}

      {application.status === "APPROVED" && (
        <section className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <h2 className="font-semibold text-emerald-900">
            {t("Your organization has been approved")}
          </h2>
          <p className="mt-1 text-sm text-emerald-900">
            {t(
              "We emailed a link to the contact address so you can set the password of the organization's account.",
            )}
          </p>
        </section>
      )}

      <section className="rounded-md border border-[rgba(136,122,71,0.35)] p-4">
        <h2 className="font-semibold">{t("Legal documents")}</h2>
        {application.documents.length ? (
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {application.documents.map((document) => (
              <li key={document.id} className="text-foreground-tertiary">
                {document.file_name ?? document.doc_type}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-foreground-tertiary">
            {t("No documents attached.")}
          </p>
        )}
      </section>

      {canWithdraw && (
        <div>
          <Button
            variant="outlined-brown"
            onClick={() => withdraw({ id, token })}
            isDisabled={isWithdrawing}
          >
            {t("Withdraw application")}
          </Button>
        </div>
      )}
    </div>
  );
}
