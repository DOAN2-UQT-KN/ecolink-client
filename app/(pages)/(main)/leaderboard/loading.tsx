import { Loader2 } from "lucide-react";

export default function LeaderboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary">
      <div className="flex items-center gap-3 rounded-2xl border border-[rgba(136,122,71,0.25)] bg-background px-5 py-4 text-foreground shadow-primary-100">
        <Loader2 className="h-5 w-5 animate-spin text-button-accent-hover" />
        <span className="text-sm">Loading leaderboard...</span>
      </div>
    </div>
  );
}
