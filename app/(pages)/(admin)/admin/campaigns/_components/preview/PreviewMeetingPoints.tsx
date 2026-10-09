import { memo } from "react";
import { useTranslation } from "react-i18next";
import { TbMapPin } from "react-icons/tb";
import type { ICampaign } from "@/apis/campaign/models/campaign";
import { ReviewRow } from "@/components/ui/ReviewSection";
import { useLocalizedDisplay } from "@/hooks/useLocalizedDisplay";
import { cn } from "@/libs/utils";
import { meetingPointName } from "@/utils/campaignLabels";

export const MeetingPoints = memo(function MeetingPoints({
  campaign,
  isDark,
}: {
  campaign: ICampaign;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const { title: localizedTitle } = useLocalizedDisplay();
  const points = campaign.meeting_points ?? [];
  const reportsById = new Map((campaign.reports ?? []).map((r) => [r.id, r]));

  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">—</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {points.map((point, index) => (
        <div
          key={point.id ?? index}
          className={cn(
            "flex flex-col gap-2",
            index > 0 && "border-t pt-4",
            isDark ? "border-zinc-700" : "border-zinc-200",
          )}
        >
          <span className="font-semibold">
            {meetingPointName(point, index, t)}
          </span>
          <ReviewRow
            label={t("Location")}
            value={
              <a
                href={`https://www.google.com/maps?q=${point.latitude},${point.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1 underline",
                  isDark ? "text-blue-300" : "text-blue-600",
                )}
              >
                <TbMapPin className="shrink-0" />
                {point.detail_address || `${point.latitude}, ${point.longitude}`}
              </a>
            }
          />
          <ReviewRow
            label={t("Waste points")}
            value={
              point.report_ids.length === 0 ? (
                t("No waste points")
              ) : (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">
                    {point.report_ids.length} · {t("within {{km}} km", { km: point.radius_km })}
                  </span>
                  <ul className="list-disc pl-4">
                    {point.report_ids.map((id) => {
                      const report = reportsById.get(id);
                      return (
                        <li key={id}>
                          <a
                            href={`/incidents/${id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline-offset-2 hover:underline"
                          >
                            {(report && localizedTitle(report)) || id}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )
            }
          />
        </div>
      ))}
    </div>
  );
});
