import { useTranslation } from "react-i18next";

import { useGetGridCell } from "@/apis/grid-cell/getGridCell";
import { Link } from "@/libs/router";
import { formattedDate } from "@/utils/formattedDate";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-border bg-card p-4">
      <div className="text-sm text-foreground-secondary">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

/** Body of the cell detail view; used by the detail page and by the map dialog. */
export function GridCellDetail({ cellKey }: { cellKey: string }) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetGridCell(cellKey);
  const detail = data?.data;

  return (
    <div className="space-y-6">
      {isLoading ? <p>{t("Loading...")}</p> : null}
      {isError ? <p>{t("Grid cell not found")}</p> : null}
      {detail ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label={t("Reports")} value={detail.cell.submitted_count} />
            <Stat label={t("Verified")} value={detail.cell.verified_count} />
            <Stat label={t("Cleanups")} value={detail.cell.cleanup_count} />
            <Stat
              label={t("Latest cleanup")}
              value={
                <span className="text-base">
                  {detail.cell.last_cleaned_at
                    ? formattedDate(detail.cell.last_cleaned_at, true)
                    : "—"}
                </span>
              }
            />
          </div>

          <p className="text-sm text-foreground-secondary">
            {t("Centre")}: {detail.cell.center_lat.toFixed(5)},{" "}
            {detail.cell.center_lng.toFixed(5)} · {detail.cell.grid_size_m} m
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">{t("Cleanup history")}</h2>
            <div className="overflow-x-auto rounded-[10px] border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-foreground-secondary">
                    <th className="p-3">{t("Cleaned at")}</th>
                    <th className="p-3">{t("Outcome")}</th>
                    <th className="p-3">{t("Reports")}</th>
                    <th className="p-3">{t("Campaign")}</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.cleanups.length === 0 ? (
                    <tr>
                      <td className="p-3" colSpan={4}>
                        {t("No cleanups recorded yet.")}
                      </td>
                    </tr>
                  ) : (
                    detail.cleanups.map((c) => (
                      <tr key={c.id} className="border-t border-border">
                        <td className="p-3">
                          {formattedDate(c.cleaned_at, true)}
                        </td>
                        <td className="p-3 capitalize">{c.outcome}</td>
                        <td className="p-3 tabular-nums">{c.report_count}</td>
                        <td className="p-3">
                          <Link href={`/admin/campaigns`}>
                            {c.campaign_id.slice(0, 8)}
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">
              {t("Reports in this cell")}
            </h2>
            <div className="overflow-x-auto rounded-[10px] border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-foreground-secondary">
                    <th className="p-3">{t("Title")}</th>
                    <th className="p-3">{t("Verified")}</th>
                    <th className="p-3">{t("Created")}</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.reports.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="p-3">
                        <Link href={`/admin/reports/${r.id}`}>
                          {r.title || r.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="p-3">{r.is_verify ? "✓" : "—"}</td>
                      <td className="p-3">{formattedDate(r.created_at, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
