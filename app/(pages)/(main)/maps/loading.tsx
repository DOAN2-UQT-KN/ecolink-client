export default function MapsLoading() {
  return (
    <div className="-mt-[92px] -mb-[92px] -mx-[20px] lg:-mx-[160px] h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <span className="h-8 w-8 rounded-full border-4 border-slate-300 border-t-emerald-500 animate-spin" />
        <span className="text-sm font-medium">Loading map…</span>
      </div>
    </div>
  );
}
