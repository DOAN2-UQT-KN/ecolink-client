import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TbArrowLeft } from "react-icons/tb";
import {
  Breadcrumbs,
  type BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { ModerationProvider, useModerationContext } from "./_context/ModerationContext";
import { ModerationQueue } from "./_components/ModerationQueue";
import { ModerationDetail } from "./_components/ModerationDetail";
import { cn } from "@/libs/utils";

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
      <div className="grid gap-6 xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        {/* Below xl one column: the queue, or the selected report with a way back. */}
        <div className={cn(selectedId && "hidden xl:block")}>
          <ModerationQueue />
        </div>
        <div className={cn("min-w-0", !selectedId && "hidden xl:block")}>
          {selectedId ? (
            <div className="flex flex-col gap-3">
              <Button variant="ghost" className="w-fit xl:hidden" onClick={() => onSelect(null)}>
                <TbArrowLeft aria-hidden />
                {t("Back to queue")}
              </Button>
              <ModerationDetail key={selectedId} reportId={selectedId} />
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{t("Select a report to review")}</EmptyTitle>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </div>
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
