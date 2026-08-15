import { useTranslation } from "react-i18next";

export function MapLoadingFallback({
  labelKey = "Loading map…",
  compact = false,
}: {
  labelKey?: string;
  compact?: boolean;
}) {
  const { t } = useTranslation();

  if (compact) {
    return (
      <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center">
        <span className="text-slate-400 text-sm">{t(labelKey)}</span>
      </div>
    );
  }

  return (
    <div className="-mt-[92px] -mb-[92px] -mx-[20px] lg:-mx-[160px] h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <span className="h-8 w-8 rounded-full border-4 border-slate-300 border-t-emerald-500 animate-spin" />
        <span className="text-sm font-medium">{t(labelKey)}</span>
      </div>
    </div>
  );
}
