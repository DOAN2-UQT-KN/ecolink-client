import { useTranslation } from "react-i18next";

import { useGetApplication } from "@/apis/organization-application/getApplication";
import { BreadcrumbItemProps } from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/client/shared/Button";
import { Link, useParams, useSearchParams } from "@/libs/router";
import { EDITABLE_APPLICATION_STATUSES } from "@/apis/organization-application/models/application";
import {
  ApplicationProvider,
  applicationEditPath,
  applicationStatusPath,
} from "../_context/ApplicationContext";
import ApplyForm from "../_components/ApplyForm";
import DraftLinkNotice from "../_components/DraftLinkNotice";
import {
  ApplicationDetailsSkeleton,
  ApplicationNotFound,
  ApplicationPageLayout,
} from "../_components/ApplicationPageLayout";

/**
 * The draft editor. Opened right after the email code (the draft and its tracking link exist
 * from then on) and again whenever the application comes back for changes. The tracking
 * token in the URL is the only credential.
 */
export default function ApplicationEditPage() {
  const { t } = useTranslation();
  const params = useParams();
  const searchParams = useSearchParams();

  const id = String(params.id ?? "");
  const token = searchParams.get("token") ?? "";
  const statusPath = applicationStatusPath(id, token);

  const { data, isLoading, isError } = useGetApplication({ id, token });
  const application = data?.data?.application;

  // `Breadcrumbs` runs every label through `t()` itself, so these stay raw English.
  const breadcrumbs: BreadcrumbItemProps[] = [
    { label: "Home", path: "/", type: "link" },
    { label: "Application status", path: statusPath, type: "link" },
    {
      label: "Edit application",
      path: applicationEditPath(id, token),
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

  if (!EDITABLE_APPLICATION_STATUSES.includes(application.status)) {
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
          application.status === "NEEDS_REVISION" && application.review_note ? (
            <section className="rounded-md border border-orange-200 bg-orange-50 p-4">
              <h3 className="font-semibold text-orange-900">
                {t("Changes needed")}
              </h3>
              <p className="mt-1 whitespace-pre-line text-sm text-orange-900">
                {application.review_note}
              </p>
            </section>
          ) : application.status === "DRAFT" ? (
            <DraftLinkNotice email={application.submitter_email} />
          ) : null
        }
      />
    </ApplicationProvider>
  );
}
