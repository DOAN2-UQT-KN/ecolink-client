import { Loader2 } from "lucide-react";

export default function LeaderboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-zinc-100 backdrop-blur">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading leaderboard...</span>
      </div>
    </div>
  );
}
