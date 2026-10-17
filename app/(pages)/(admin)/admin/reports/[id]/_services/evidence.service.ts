/**
 * Narrow readers for check evidence (free-form JSON on the wire, snake_case keys; research R1).
 * Missing or mistyped fields come back as null instead of being trusted.
 */
type Json = Record<string, unknown>;

const obj = (v: unknown): Json | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

export interface ReportMatch {
  kind: "report";
  reportId: string;
  sameUser: boolean | null;
  imageIndex: number | null;
  distanceM: number | null;
  timeDeltaHours: number | null;
  phashDistance: number | null;
  inliers: number | null;
}

/** A web image found by the signal `internet` (specs/011); URLs are kept only when https. */
export interface WebMatch {
  kind: "web";
  imageIndex: number | null;
  matchType: "FULL" | "PARTIAL" | null;
  verifiedBy: "phash" | "orb" | null;
  phashDistance: number | null;
  inliers: number | null;
  flipped: boolean | null;
  sourceUrl: string;
  pageUrl: string | null;
  pageTitle: string | null;
}

export type DuplicateMatch = ReportMatch | WebMatch;

export interface WebCandidate {
  imageUrl: string;
  pageUrl: string | null;
  pageTitle: string | null;
  matchType: "FULL" | "PARTIAL" | null;
}

const httpsUrl = (v: unknown): string | null => {
  const s = str(v);
  return s?.startsWith("https://") ? s : null;
};
const matchTypeOf = (v: unknown) => (v === "FULL" || v === "PARTIAL" ? v : null);

export function readDuplicateMatch(evidence: unknown): DuplicateMatch | null {
  const match = obj(obj(evidence)?.match);
  if (match?.method === "internet") {
    const sourceUrl = httpsUrl(match.source_url);
    if (!sourceUrl) return null;
    return {
      kind: "web",
      imageIndex: num(match.image_index),
      matchType: matchTypeOf(match.match_type),
      verifiedBy: match.verified_by === "phash" || match.verified_by === "orb" ? match.verified_by : null,
      phashDistance: num(match.phash_distance),
      inliers: num(match.inliers),
      flipped: typeof match.flipped === "boolean" ? match.flipped : null,
      sourceUrl,
      pageUrl: httpsUrl(match.page_url),
      pageTitle: str(match.page_title),
    };
  }
  const reportId = str(match?.report_id);
  if (!match || !reportId) return null;
  return {
    kind: "report",
    reportId,
    sameUser: typeof match.same_user === "boolean" ? match.same_user : null,
    imageIndex: num(match.image_index),
    distanceM: num(match.distance_m),
    timeDeltaHours: num(match.time_delta_hours),
    phashDistance: num(match.phash_distance),
    inliers: num(match.inliers),
  };
}

/** Web candidates left for the moderator when the signal `internet` could not download them. */
export function readWebCandidates(evidence: unknown): WebCandidate[] {
  const list = obj(obj(evidence)?.web)?.candidates;
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) => {
    const c = obj(item);
    const imageUrl = httpsUrl(c?.image_url);
    return c && imageUrl
      ? [{ imageUrl, pageUrl: httpsUrl(c.page_url), pageTitle: str(c.page_title), matchType: matchTypeOf(c.match_type) }]
      : [];
  });
}

export interface TrustEvidence {
  live: number | null;
  gallery: number | null;
  total90d: number | null;
  rejected90d: number | null;
  accountAgeDays: number | null;
}

export function readTrustEvidence(evidence: unknown): TrustEvidence {
  const e = obj(evidence);
  const images = obj(e?.images);
  return {
    live: num(images?.live),
    gallery: num(images?.gallery),
    // `totalReports90d` is snake-cased by the server to `total_reports90d`.
    total90d: num(e?.total_reports90d),
    rejected90d: num(e?.rejected90d),
    accountAgeDays: num(e?.account_age_days),
  };
}

export interface ContextEvidence {
  category: string | null;
  verdict: string | null;
  nearest: { name: string; distanceM: number | null } | null;
}

export function readContextEvidence(evidence: unknown): ContextEvidence {
  const e = obj(evidence);
  const nearest = obj(e?.nearest);
  const name = str(nearest?.name);
  return {
    category: str(e?.category),
    verdict: str(e?.verdict),
    nearest: name ? { name, distanceM: num(nearest?.distance_m) } : null,
  };
}
