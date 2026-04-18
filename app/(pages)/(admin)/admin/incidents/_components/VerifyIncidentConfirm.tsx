"use client";

import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useBanReport } from "@/apis/incident/banReport";
import { useVerifyReport } from "@/apis/incident/verifyReport";
import { ConfirmPopover } from "@/components/admin/shared/ConfirmPopover";
import { cn } from "@/libs/utils";
import { TbCheckbox } from "react-icons/tb";

type Props = {
  incidentId: string;
  incidentTitle: string;
  theme: "light" | "dark";
};

export const VerifyIncidentConfirm = memo(function VerifyIncidentConfirm({
  incidentId,
  incidentTitle,
  theme,
}: Props) {
  const { t } = useTranslation();

  const { mutateAsync: verifyAsync, isPending: approving } = useVerifyReport({
    queryKey: ["incidents"],
  });

  const { mutateAsync: banAsync, isPending: banning } = useBanReport({
    queryKey: ["incidents"],
  });

  const handleVerify = useCallback(async () => {
    await verifyAsync(incidentId);
  }, [verifyAsync, incidentId]);

  const handleReject = useCallback(async () => {
    await banAsync(incidentId);
  }, [banAsync, incidentId]);

  const isDark = theme === "dark";

  return (
    <ConfirmPopover
      theme={theme}
      title={t("Verify this incident?")}
      description={t("You can verify {{name}} or reject it.", {
        name: incidentTitle,
      })}
      confirmLabel={t("Verify")}
      rejectLabel={t("Ban")}
      onConfirm={handleVerify}
      onReject={handleReject}
      confirmPending={approving}
      rejectPending={banning}
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

export default VerifyIncidentConfirm;
