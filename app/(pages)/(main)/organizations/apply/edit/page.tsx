import { useTranslation } from "react-i18next";

import { useGetApplication } from "@/apis/organization-application/getApplication";
import { BreadcrumbItemProps } from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/client/shared/Button";
import { Link, useParams, useSearchParams } from "@/libs/router";
import { ApplicationProvider } from "../_context/ApplicationContext";
import ApplyForm from "../_components/ApplyForm";
import {
  ApplicationDetailsSkeleton,
  ApplicationNotFound,
  ApplicationPageLayout,
} from "../_components/ApplicationPageLayout";

/**
 * Resubmission after a reviewer asked for more information. Reached from the tracking page;
 * the tracking token in the URL is the only credential, exactly as there.
 */
export default function ApplicationEditPage() {
  const { t } = useTranslation();
  const params = useParams();
  const searchParams = useSearchParams();

  const id = String(params.id ?? "");
  const token = searchParams.get("token") ?? "";
  const statusPath = `/organizations/apply/status/${id}?token=${encodeURIComponent(token)}`;

  const { data, isLoading, isError } = useGetApplication({ id, token });
  const application = data?.data?.application;

  // `Breadcrumbs` runs every label through `t()` itself, so these stay raw English.
  const breadcrumbs: BreadcrumbItemProps[] = [
    { label: "Home", path: "/", type: "link" },
    { label: "Application status", path: statusPath, type: "link" },
    {
      label: "Edit application",
      path: `/organizations/apply/edit/${id}?token=${encodeURIComponent(token)}`,
      type: "page",
    },
  ];

  if (!token || isError) {
    return (
      <ApplicationPageLayout breadcrumbs={breadcrumbs}>
        <ApplicationNotFound
          message={t("This tracking link is invalid or has expired.")}
        />
      </ApplicationPageLayout>
    );
  }

  if (isLoading || !application) {
    return (
      <ApplicationPageLayout breadcrumbs={breadcrumbs}>
        <ApplicationDetailsSkeleton />
      </ApplicationPageLayout>
    );
  }

  if (application.status !== "NEEDS_MORE_INFO") {
    return (
      <ApplicationPageLayout breadcrumbs={breadcrumbs}>
        <div className="flex flex-col items-start gap-4">
          <h2 className="font-display-6 font-semibold !text-button-accent">
            {t("Edit application")}
          </h2>
          <p className="text-sm text-foreground-tertiary">
            {t("This application can no longer be edited.")}
          </p>
          <Link href={statusPath}>
            <Button variant="outlined-brown">{t("Back to application status")}</Button>
          </Link>
        </div>
      </ApplicationPageLayout>
    );
  }

  return (
    <ApplicationProvider edit={{ application, trackingToken: token }}>
      <ApplyForm
        breadcrumbs={breadcrumbs}
        notice={
          application.review_note ? (
            <section className="rounded-md border border-orange-200 bg-orange-50 p-4">
              <h3 className="font-semibold text-orange-900">
                {t("A reviewer asked for more information")}
              </h3>
              <p className="mt-1 whitespace-pre-line text-sm text-orange-900">
                {application.review_note}
              </p>
            </section>
          ) : null
        }
      />
    </ApplicationProvider>
  );
}
