import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TbArrowLeft } from "react-icons/tb";
import {
  Breadcrumbs,
  type BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { ModerationProvider, useModerationContext } from "./_context/ModerationContext";
import { ModerationQueue } from "./_components/ModerationQueue";
import { ModerationDetail } from "./_components/ModerationDetail";

function ModerationContent() {
  const { t } = useTranslation();
  const { selectedId, onSelect } = useModerationContext();

  const breadcrumbs: BreadcrumbItemProps[] = useMemo(
    () => [
      { label: t("Dashboard"), path: "/admin", type: "link" },
      { label: t("Report moderation"), path: "/admin/moderation", type: "page" },
    ],
    [t],
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs breadcrumbs={breadcrumbs} isAdmin={true} />
      {/* One view at a time: the queue, or the selected report with a way back. */}
      {selectedId ? (
        <div className="flex flex-col gap-3">
          <Button variant="ghost" className="w-fit" onClick={() => onSelect(null)}>
            <TbArrowLeft aria-hidden />
            {t("Back to queue")}
          </Button>
          <ModerationDetail key={selectedId} reportId={selectedId} />
        </div>
      ) : (
        <ModerationQueue />
      )}
    </div>
  );
}

export default function AdminModerationPage() {
  return (
    <ModerationProvider>
      <ModerationContent />
    </ModerationProvider>
  );
}
