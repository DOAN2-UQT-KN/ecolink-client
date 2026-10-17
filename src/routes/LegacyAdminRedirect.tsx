import { Navigate, useLocation, useSearchParams } from "react-router-dom";

/** Old `/admin/incidents` links (specs/008): same list, now at `/admin/reports`, query kept. */
export function IncidentsRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/admin/reports${search}`} replace />;
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
