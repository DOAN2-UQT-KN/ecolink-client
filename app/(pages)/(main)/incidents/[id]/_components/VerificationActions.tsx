import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { TbCamera } from "react-icons/tb";
import { useAddReportMedia } from "@/apis/incident/addReportMedia";
import { useCreateCapture } from "@/apis/incident/createCapture";
import { useDeleteReport } from "@/apis/incident/deleteReport";
import type { IIncident } from "@/apis/incident/models/incident";
import type { IVerificationIssue } from "@/apis/incident/models/verification";
import { Button } from "@/components/client/shared/Button";
import { ConfirmPopover } from "@/components/ui/ConfirmPopover";
import type { VerificationOutcome } from "@/constants/reportVerification";
import { compressImage } from "@/libs/compressImage";
import { uploadWithCapture } from "@/libs/cloudinary";
import { useRouter } from "@/libs/router";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";

/** Next steps for the owner, by outcome and issue (specs/007 US3). "View similar report" lives in its IssueCard (specs/010). */
export default function VerificationActions({
  incident,
  outcome,
  issues,
}: {
  incident: IIncident;
  outcome: VerificationOutcome;
  issues: IVerificationIssue[];
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const capturePromiseRef = useRef<ReturnType<typeof requestCapture> | null>(null);
  const [uploading, setUploading] = useState(false);

  const { mutateAsync: createCapture } = useCreateCapture();
  const { mutateAsync: addMedia, isPending: adding } = useAddReportMedia({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-detail", incident.id] });
      queryClient.invalidateQueries({ queryKey: ["reports", "verification", incident.id] });
    },
  });
  const { mutateAsync: deleteReport, isPending: deleting } = useDeleteReport({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reports"] });
      router.push("/incidents/me");
    },
  });

  const notLive = issues.some((i) => i.code === "TRUST_NOT_LIVE_CAPTURE");
  // The server refuses edits on rejected reports; withdrawing a report a campaign already took is not offered.
  const canEdit = outcome !== "rejected";
  const canWithdraw = canEdit && !incident.handled_by;

  function requestCapture() {
    return createCapture()
      .then((res) => ({ id: res.data.capture_id, expiresAt: res.data.expires_at, upload: res.data.upload }))
      .catch(() => undefined);
  }

  const retake = () => {
    capturePromiseRef.current = requestCapture();
    cameraInputRef.current?.click();
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const [blob, capture] = await Promise.all([compressImage(file), capturePromiseRef.current]);
      const { url, captureId } = await uploadWithCapture(blob, capture ?? undefined);
      await addMedia({ id: incident.id, data: { images: [captureId ? { url, capture_id: captureId } : { url }] } });
    } catch {
      showMessage({ type: MessageType.Toast, level: MessageLevel.Error, title: t("Failed to upload images") });
    } finally {
      capturePromiseRef.current = null;
      setUploading(false);
    }
  };

  const primary =
    outcome === "rejected" ? (
      <Button variant="brown" onClick={() => router.push("/incidents/create")}>
        {t("Create a new report")}
      </Button>
    ) : null;

  const retakeButton =
    canEdit && notLive ? (
      <Button
        variant={primary ? "outlined-brown" : "brown"}
        iconLeft={<TbCamera aria-hidden />}
        isLoading={uploading || adding}
        onClick={retake}
      >
        {t("Retake photo")}
      </Button>
    ) : null;

  const withdraw = canWithdraw ? (
    <ConfirmPopover
      theme="light"
      trigger={<Button variant="outlined-brown">{t("Withdraw report")}</Button>}
      title={t("Withdraw this report?")}
      description={t("The report will be removed and cannot be restored.")}
      confirmLabel={t("Withdraw report")}
      confirmPending={deleting}
      onConfirm={async () => {
        try {
          await deleteReport(incident.id);
          return true;
        } catch {
          return false;
        }
      }}
    />
  ) : null;

  if (!primary && !retakeButton && !withdraw) return null;

  return (
    <>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPhoto}
      />
      {/* Below 640 px the actions stick to the bottom of the screen; the panel reserves the space. */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-wrap gap-3 border-t border-border bg-background-primary p-4 sm:static sm:border-0 sm:bg-transparent sm:p-0">
        {primary}
        {retakeButton}
        {withdraw}
      </div>
    </>
  );
}
