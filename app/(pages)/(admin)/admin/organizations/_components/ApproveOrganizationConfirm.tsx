"use client";

import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useVerifyOrganization,
} from "@/apis/organization/organizationById";
import { ConfirmPopover } from "@/components/admin/shared/ConfirmPopover";
import { cn } from "@/libs/utils";
import { TbCheckbox } from "react-icons/tb";
import { STATUS } from "@/constants/status";
import { queryClient } from "@/libs/queryClient";

type Props = {
  organizationId: string;
  organizationName: string;
  theme: "light" | "dark";
};

export const ApproveOrganizationConfirm = memo(function ApproveOrganizationConfirm({
  organizationId,
  organizationName,
  theme,
}: Props) {
  const { t } = useTranslation();
  const [rejecting, setRejecting] = useState(false);

  const { mutate: verify, isPending: approving } = useVerifyOrganization({
    queryKey: ["organizations"],
  });

  const handleVerify = useCallback((status: number) => {
    verify({
      id: organizationId,
      status
    },
    {
      onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["organizations"] });
      },
    },
  );
  }, [organizationId]);

  const isDark = theme === "dark";

  return (
    <ConfirmPopover
      theme={theme}
      title={t("Approve this organization?")}
      description={t("You can verify {{name}} or reject it.", {
        name: organizationName,
      })}
      confirmLabel={t("Approve")}
      rejectLabel={t("Reject")}
      // cancelLabel={t("Cancel")}
      onConfirm={() => handleVerify(STATUS.ACTIVE)}
      onReject={() => handleVerify(STATUS.INACTIVE)}
      confirmPending={approving}
      rejectPending={rejecting}
      trigger={
        <button
          type="button"
          className={cn(
            "rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors cursor-pointer duration-200",
            isDark
              ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-green-200"
              : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-green-700",
          )}
        >
          <TbCheckbox className="size-5" />
        </button>
      }
    />
  );
});

export default ApproveOrganizationConfirm;
