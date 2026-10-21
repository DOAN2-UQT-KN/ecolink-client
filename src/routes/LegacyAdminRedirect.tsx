import { Navigate, useLocation, useSearchParams } from "react-router-dom";

/** Old `/admin/incidents` links (specs/008): same list, now at `/admin/reports`, query kept. */
export function IncidentsRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/admin/reports${search}`} replace />;
}

/** Pages merged into a tab of another page: old links open that tab, query kept. */
export function TabRedirect({ to, tab }: { to: string; tab: string }) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.set("tab", tab);
  return <Navigate to={`${to}?${params.toString()}`} replace />;
}

/** Old moderation links: one report → its Moderation tab; the queue → the filtered report list. */
export function ModerationRedirect() {
  const [params] = useSearchParams();
  const id = params.get("id");
  const flag = params.get("flag") === "REJECT" ? "REJECT" : "REVIEW";
  return (
    <Navigate
      to={id ? `/admin/reports/${encodeURIComponent(id)}?tab=moderation` : `/admin/reports?moderation=${flag}`}
      replace
    />
  );
}
