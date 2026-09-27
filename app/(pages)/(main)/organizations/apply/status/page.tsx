import { useTranslation } from "react-i18next";
import { TbPencil } from "react-icons/tb";

import {
  useGetApplication,
} from "@/apis/organization-application/getApplication";
import { useWithdrawApplication } from "@/apis/organization-application/saveApplication";
import {
  EDITABLE_APPLICATION_STATUSES,
  type ApplicationStatus,
} from "@/apis/organization-application/models/application";
import { ConfirmPopoverModal } from "@/modules/OrganizationCard/components/ConfirmPopoverModal";
import { BreadcrumbItemProps } from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/client/shared/Button";
import { Link, useParams, useSearchParams } from "@/libs/router";
import { queryClient } from "@/libs/queryClient";
import ApplicationDetails from "../_components/ApplicationDetails";
import OwnerConfirmations from "../_components/OwnerConfirmations";
import { applicationEditPath } from "../_context/ApplicationContext";
import {
  ApplicationDetailsSkeleton,
  ApplicationNotFound,
  ApplicationPageLayout,
} from "../_components/ApplicationPageLayout";

/** Anything before a decision can be withdrawn, drafts included. */
const OPEN_STATUSES: ApplicationStatus[] = [
  "DRAFT",
  "AWAITING_OWNER_CONFIRMATION",
  "PENDING_REVIEW",
  "NEEDS_REVISION",
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

  // `Breadcrumbs` runs every label through `t()` itself, so these stay raw English.
  const breadcrumbs: BreadcrumbItemProps[] = [
    { label: "Home", path: "/", type: "link" },
    { label: "Organizations", path: "/organizations", type: "link" },
    {
      label: "Application status",
      path: `/organizations/apply/status/${id}?token=${encodeURIComponent(token)}`,
      type: "page",
    },
  ];

  if (!token) {
    return (
      <ApplicationPageLayout breadcrumbs={breadcrumbs}>
        <ApplicationNotFound
          message={t("This link is missing its tracking token.")}
        />
      </ApplicationPageLayout>
    );
  }

  if (isLoading) {
    return (
      <ApplicationPageLayout breadcrumbs={breadcrumbs}>
        <ApplicationDetailsSkeleton />
      </ApplicationPageLayout>
    );
  }

  if (isError || !application) {
    return (
      <ApplicationPageLayout breadcrumbs={breadcrumbs}>
        <ApplicationNotFound
          message={t("This tracking link is invalid or has expired.")}
        />
      </ApplicationPageLayout>
    );
  }

  const canWithdraw = OPEN_STATUSES.includes(application.status);
  // A draft, or an application sent back by a reviewer or an owner, reopens the form.
  const canEdit = EDITABLE_APPLICATION_STATUSES.includes(application.status);
  const hasConfirmedOwners = application.owners.some(
    (owner) => owner.status === "CONFIRMED" && !owner.is_submitter,
  );

  return (
    <ApplicationPageLayout breadcrumbs={breadcrumbs}>
      <ApplicationDetails application={application} trackingToken={token} />

      {application.status !== "DRAFT" && (
        <OwnerConfirmations application={application} trackingToken={token} />
      )}

      {(canWithdraw || canEdit) && (
        <div className="flex flex-col-reverse gap-3 border-t border-[rgba(136,122,71,0.3)] pt-6 sm:flex-row sm:justify-end">
          {canWithdraw && (
            <ConfirmPopoverModal
              title={t("Withdraw this application?")}
              description={
                hasConfirmedOwners
                  ? t(
                      "Unanswered confirmation links stop working, and owners who already confirmed will be told by email.",
                    )
                  : t("Unanswered confirmation links stop working.")
              }
              confirmLabel={t("Withdraw application")}
              cancelLabel={t("Keep it")}
              confirmPending={isWithdrawing}
              onConfirm={() => withdraw({ id, token })}
              trigger={
                <Button
                  variant="outlined-brown"
                  isDisabled={isWithdrawing}
                  className="w-full sm:w-auto"
                >
                  {t("Withdraw application")}
                </Button>
              }
            />
          )}
          {canEdit && (
            <Link href={applicationEditPath(id, token)}>
              <Button
                variant="brown"
                iconLeft={<TbPencil className="size-5" />}
                className="w-full sm:w-auto"
              >
                {application.status === "DRAFT"
                  ? t("Continue your application")
                  : t("Edit application")}
              </Button>
            </Link>
          )}
        </div>
      )}
    </ApplicationPageLayout>
  );
}
