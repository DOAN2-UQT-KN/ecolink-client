import { memo } from "react";
import { useTranslation } from "react-i18next";

import type { IApplication } from "@/apis/organization-application/models/application";
import { useResendOwnerInvite } from "@/apis/organization-application/saveApplication";
import { Button } from "@/components/client/shared/Button";
import TagStatus from "@/components/ui/TagStatus";
import { OWNER_CANDIDATE_STATUS_TAG } from "@/constants/organizationApplicationStatus";
import { queryClient } from "@/libs/queryClient";
import { Link } from "@/libs/router";
import { formattedDate } from "@/utils/formattedDate";
import { applicationEditPath } from "../_context/ApplicationContext";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Who has confirmed so far. Without this the submitter would not understand why an
 * application that is "submitted" is not being reviewed yet.
 */
export const OwnerConfirmations = memo(function OwnerConfirmations({
  application,
  trackingToken,
}: {
  application: IApplication;
  trackingToken: string;
}) {
  const { t } = useTranslation();
  const { mutate: resend, isPending, variables } = useResendOwnerInvite({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organization-application", application.id, trackingToken],
      });
    },
  });

  const canResend =
    application.status === "AWAITING_OWNER_CONFIRMATION" ||
    application.status === "NEEDS_REVISION";
  const canReplace = application.status === "NEEDS_REVISION";
  const total = application.total_owners || application.owners.length;
  const percent = total ? Math.round((application.confirmed_count / total) * 100) : 0;
  const now = Date.now();

  if (application.owners.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 rounded-md border border-[rgba(136,122,71,0.35)] p-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">{t("Owner confirmations")}</h3>
          <span className="text-sm text-foreground-tertiary">
            {t("{{confirmed}}/{{total}} confirmed", {
              confirmed: application.confirmed_count,
              total,
            })}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(136,122,71,0.15)]">
          <div
            className="h-full rounded-full bg-button-accent transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        {application.status === "AWAITING_OWNER_CONFIRMATION" && (
          <p className="text-sm text-foreground-tertiary">
            {t(
              "Your application will join the review queue once every owner has confirmed.",
            )}
          </p>
        )}
      </div>

      <div className="flex flex-col divide-y divide-[rgba(136,122,71,0.2)]">
        {application.owners.map((owner) => {
          const tag = OWNER_CANDIDATE_STATUS_TAG[owner.status];
          const daysLeft =
            owner.status === "PENDING" && owner.expires_at
              ? Math.max(
                  0,
                  Math.ceil((new Date(owner.expires_at).getTime() - now) / DAY_MS),
                )
              : null;
          const nextResendAt = owner.next_resend_at
            ? new Date(owner.next_resend_at)
            : null;
          const resendReady =
            canResend &&
            owner.status === "PENDING" &&
            !owner.is_submitter &&
            (!nextResendAt || nextResendAt.getTime() <= now);
          // Resends are unlimited but an hour apart; say when the next one opens up.
          const resendLockedUntil =
            canResend &&
            owner.status === "PENDING" &&
            !owner.is_submitter &&
            nextResendAt &&
            nextResendAt.getTime() > now
              ? nextResendAt
              : null;
          const isResending = isPending && variables?.candidateId === owner.id;

          return (
            <div
              key={owner.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium break-words">
                  {owner.full_name}{" "}
                  <span className="font-normal text-foreground-tertiary">
                    &lt;{owner.email}&gt;
                  </span>
                  {owner.is_submitter && (
                    <span className="ml-2 text-xs text-button-accent">
                      ({t("you")})
                    </span>
                  )}
                </span>
                <span className="text-xs text-foreground-tertiary">
                  {owner.is_legal_rep ? t("Legal representative") : t("Owner")}
                  {owner.responded_at &&
                    ` · ${formattedDate(owner.responded_at, true)}`}
                  {daysLeft !== null &&
                    ` · ${t("{{count}} days left", { count: daysLeft })}`}
                  {owner.sent_count > 1 &&
                    ` · ${t("Sent {{count}} times", { count: owner.sent_count })}`}
                </span>
                {resendLockedUntil && (
                  <span className="text-xs text-foreground-tertiary">
                    {t("You can resend at {{time}}", {
                      time: formattedDate(resendLockedUntil.toISOString(), true),
                    })}
                  </span>
                )}
                {owner.status === "DECLINED" && owner.decline_reason && (
                  <span className="text-xs text-red-700">
                    “{owner.decline_reason}”
                  </span>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <TagStatus type={tag.type} label={t(tag.label)} className="!m-0" />
                {canResend && owner.status === "PENDING" && !owner.is_submitter && (
                  <Button
                    variant="outlined-brown"
                    // size="small"
                    isDisabled={!resendReady || isResending}
                    onClick={() =>
                      resend({
                        id: application.id,
                        token: trackingToken,
                        candidateId: owner.id,
                      })
                    }
                  >
                    {t("Resend")}
                  </Button>
                )}
                {canReplace &&
                  (owner.status === "DECLINED" || owner.status === "EXPIRED") && (
                    <Link href={applicationEditPath(application.id, trackingToken)}>
                      <Button variant="brown" >
                        {t("Replace")}
                      </Button>
                    </Link>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});

export default OwnerConfirmations;
