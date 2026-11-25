import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useVoteRiskSite } from "@/apis/risk-site/voteRiskSite";
import type { RiskVerdict } from "@/apis/risk-site/models/riskSite";
import useAuthStore from "@/stores/useAuthStore";

type VoteMessage = {
  type: "risk-vote";
  rank: number;
  prev: string | null;
  verdict: RiskVerdict;
  site: { lat: number; lng: number; address: string };
};

/**
 * Trash risk map produced by the dumpsite-risk model (a snapshot, regenerate it to refresh).
 * The map is a self-contained HTML file in /public. It cannot call our API itself, so when someone
 * answers "there is trash / none" it posts the answer here and this page sends it, as the signed-in user.
 */
export default function RiskMapPage() {
  const { t } = useTranslation();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const isAuthenticated = useAuthStore((state) => state.is_authenticated);
  const { mutateAsync: vote } = useVoteRiskSite();

  useEffect(() => {
    const reply = (
      msg: VoteMessage,
      result: { ok: boolean; message?: string },
    ) =>
      frameRef.current?.contentWindow?.postMessage(
        { type: "risk-vote-result", rank: msg.rank, prev: msg.prev, ...result },
        window.location.origin,
      );

    const onMessage = async (e: MessageEvent<VoteMessage>) => {
      // Only our own iframe may cast a vote.
      if (e.origin !== window.location.origin) return;
      if (e.source !== frameRef.current?.contentWindow) return;
      const msg = e.data;
      if (msg?.type !== "risk-vote") return;

      if (!isAuthenticated) {
        reply(msg, { ok: false, message: t("Sign in to send your answer") });
        return;
      }
      try {
        await vote({ ...msg.site, verdict: msg.verdict });
        reply(msg, { ok: true });
      } catch {
        reply(msg, { ok: false, message: t("Could not send your answer") });
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [isAuthenticated, t, vote]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-6 pt-28">
      <iframe
        ref={frameRef}
        title={t("Trash risk map")}
        src="/risk-map.html"
        className="h-[78vh] min-h-[480px] w-full rounded-[10px] border border-border"
        loading="lazy"
      />
    </div>
  );
}
