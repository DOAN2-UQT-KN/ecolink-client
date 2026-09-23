import { useTranslation } from "react-i18next";

import {
  useGetApplication,
} from "@/apis/organization-application/getApplication";
import { useWithdrawApplication } from "@/apis/organization-application/createApplication";
import type { ApplicationStatus } from "@/apis/organization-application/models/application";
import { BreadcrumbItemProps } from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/client/shared/Button";
import { useParams, useSearchParams } from "@/libs/router";
import { queryClient } from "@/libs/queryClient";
import ApplicationDetails from "../_components/ApplicationDetails";
import {
  ApplicationDetailsSkeleton,
  ApplicationNotFound,
  ApplicationPageLayout,
} from "../_components/ApplicationPageLayout";

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

  return (
    <ApplicationPageLayout breadcrumbs={breadcrumbs}>
      <ApplicationDetails application={application} />

      {canWithdraw && (
        <div className="flex justify-end border-t border-[rgba(136,122,71,0.3)] pt-6">
          <Button
            variant="outlined-brown"
            onClick={() => withdraw({ id, token })}
            isDisabled={isWithdrawing}
          >
            {t("Withdraw application")}
          </Button>
        </div>
      )}
    </ApplicationPageLayout>
  );
}
