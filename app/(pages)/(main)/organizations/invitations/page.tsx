import { useTranslation } from "react-i18next";
import { TbAlertTriangle, TbCircleCheck, TbCircleX } from "react-icons/tb";

import {
  useAcceptInvitation,
  useDeclineInvitation,
  useGetInvitationByToken,
} from "@/apis/organization/invitations";
import { BreadcrumbItemProps } from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/client/shared/Button";
import AppImage from "@/components/ui/AppImage";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { Link, useRouter, useSearchParams } from "@/libs/router";
import { formattedDate } from "@/utils/formattedDate";
import {
  ApplicationDetailsSkeleton,
  ApplicationNotFound,
  ApplicationPageLayout,
} from "../apply/_components/ApplicationPageLayout";
import { SummaryRow } from "../apply/_components/ApplicationDetails";

// `Breadcrumbs` runs every label through `t()` itself, so these stay raw English.
const breadcrumbs: BreadcrumbItemProps[] = [
  { label: "Home", path: "/", type: "link" },
  { label: "Organizations", path: "/organizations", type: "link" },
  { label: "Invitation", path: "/organizations/invitations", type: "page" },
];

function Outcome({
  tone,
  title,
  message,
}: {
  tone: "success" | "neutral" | "warning";
  title: string;
  message: string;
}) {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    neutral:
      "border-[rgba(136,122,71,0.35)] bg-[rgba(136,122,71,0.06)] text-foreground-secondary",
    warning: "border-orange-200 bg-orange-50 text-orange-900",
  }[tone];
  const Icon =
    tone === "success" ? TbCircleCheck : tone === "warning" ? TbAlertTriangle : TbCircleX;
  return (
    <section className={`flex gap-3 rounded-md border p-4 ${styles}`}>
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm">{message}</p>
      </div>
    </section>
  );
}

/**
 * Public page behind the link in a member invitation email. Owning the mailbox is the
 * consent, so no login is needed; a signed-in visitor using another account is warned.
 */
export default function OrganizationInvitationPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const { data, isLoading, isError, refetch } = useGetInvitationByToken(token);
  const invitation = data?.data?.invitation;

  const { mutate: accept, isPending: isAccepting } = useAcceptInvitation({
    onSuccess: (res) => {
      router.push(`/organizations/${encodeURIComponent(res.data.organization_slug)}`);
    },
    onSettled: () => void refetch(),
  });
  const { mutate: decline, isPending: isDeclining } = useDeclineInvitation({
    onSettled: () => void refetch(),
  });

  if (!token || isError) {
    return (
      <ApplicationPageLayout breadcrumbs={breadcrumbs}>
        <ApplicationNotFound message={t("This invitation link is invalid.")} />
      </ApplicationPageLayout>
    );
  }

  if (isLoading || !invitation) {
    return (
      <ApplicationPageLayout breadcrumbs={breadcrumbs}>
        <ApplicationDetailsSkeleton />
      </ApplicationPageLayout>
    );
  }

  const { organization } = invitation;

  return (
    <ApplicationPageLayout breadcrumbs={breadcrumbs}>
      <header className="flex items-center gap-4">
        {organization.logo_url && (
          <AppImage
            src={organization.logo_url}
            alt={organization.name}
            className="size-[64px] shrink-0 rounded-full border border-[rgba(136,122,71,0.35)] bg-white object-cover"
          />
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="font-display-6 font-semibold !text-button-accent break-words">
            {organization.name}
          </h2>
          <Link
            href={`/organizations/${encodeURIComponent(organization.slug)}`}
            className="text-sm text-button-accent underline-offset-4 hover:underline"
          >
            {t("View organization")}
          </Link>
        </div>
      </header>

      <p className="text-sm">
        {t("{{inviter}} invited you ({{email}}) to join this organization.", {
          inviter: invitation.inviter_name,
          email: invitation.invitee_email,
        })}
      </p>

      <section className="flex flex-col gap-3 rounded-md border border-[rgba(136,122,71,0.35)] p-4">
        <SummaryRow label={t("Your role")} value={<RoleBadge role={invitation.role} />} />
        <SummaryRow label={t("Invited by")} value={invitation.inviter_name} />
        {invitation.expires_at && (
          <SummaryRow
            label={t("Valid until")}
            value={formattedDate(invitation.expires_at, true)}
          />
        )}
      </section>

      {invitation.session_mismatch && invitation.active && (
        <Outcome
          tone="warning"
          title={t("You are signed in with a different account")}
          message={t(
            "This invitation was sent to {{email}}. Only accept if that account is yours.",
            { email: invitation.invitee_email },
          )}
        />
      )}
      {invitation.status === "ACCEPTED" && (
        <Outcome
          tone="success"
          title={t("You joined this organization")}
          message={t("You are now a member.")}
        />
      )}
      {invitation.status === "DECLINED" && (
        <Outcome
          tone="neutral"
          title={t("You declined")}
          message={t("You will not be added to this organization.")}
        />
      )}
      {invitation.expired && (
        <Outcome
          tone="warning"
          title={t("This link has expired")}
          message={t("Ask a member of the organization to invite you again.")}
        />
      )}
      {!invitation.active &&
        !invitation.expired &&
        invitation.status !== "ACCEPTED" &&
        invitation.status !== "DECLINED" && (
          <Outcome
            tone="neutral"
            title={t("This invitation is no longer active")}
            message={t("It was cancelled, so there is nothing to accept.")}
          />
        )}

      {invitation.active && (
        <div className="flex flex-col-reverse gap-3 border-t border-[rgba(136,122,71,0.3)] pt-6 sm:flex-row sm:justify-end">
          <Button
            variant="outlined-brown"
            onClick={() => decline({ token })}
            isDisabled={isAccepting || isDeclining}
            className="w-full sm:w-auto"
          >
            {t("Decline")}
          </Button>
          <Button
            variant="brown"
            onClick={() => accept({ token })}
            isDisabled={isAccepting || isDeclining}
            className="w-full sm:w-auto"
          >
            {isAccepting ? t("Joining...") : t("Accept and join")}
          </Button>
        </div>
      )}
    </ApplicationPageLayout>
  );
}
