"use client";

import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { useVerifyReport } from "@/apis/incident/verifyReport";
import { ConfirmPopover } from "@/components/admin/shared/ConfirmPopover";
import { cn } from "@/libs/utils";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";
import { TbCheckbox } from "react-icons/tb";

type Props = {
  incidentId: string;
  incidentTitle: string;
  theme: "light" | "dark";
};

async function banIncidentMock(_id: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 280));
}

export const VerifyIncidentConfirm = memo(function VerifyIncidentConfirm({
  incidentId,
  incidentTitle,
  theme,
}: Props) {
  const { t } = useTranslation();
  const [rejecting, setRejecting] = useState(false);

  const { mutateAsync: verifyAsync, isPending: approving } = useVerifyReport({
    queryKey: ["incidents"],
  });

  const handleVerify = useCallback(async () => {
    await verifyAsync(incidentId);
  }, [verifyAsync, incidentId]);

  const handleReject = useCallback(async () => {
    setRejecting(true);
    try {
      await banIncidentMock(incidentId);
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Info,
        title: t("Rejection is not connected to the API yet (mock)."),
      });
    } finally {
      setRejecting(false);
    }
  }, [incidentId, t]);

  const isDark = theme === "dark";

  return (
    <ConfirmPopover
      theme={theme}
      title={t("Verify this incident?")}
      description={t("You can verify {{name}} or reject it. Reject is currently a mock.", {
        name: incidentTitle,
      })}
      confirmLabel={t("Verify")}
      rejectLabel={t("Reject")}
      onConfirm={handleVerify}
      onReject={handleReject}
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

export default VerifyIncidentConfirm;
