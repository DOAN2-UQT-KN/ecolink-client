/**
 * Narrow readers for check evidence (free-form JSON on the wire, snake_case keys; research R1).
 * Missing or mistyped fields come back as null instead of being trusted.
 */
type Json = Record<string, unknown>;

const obj = (v: unknown): Json | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

export interface DuplicateMatch {
  reportId: string;
  sameUser: boolean | null;
  imageIndex: number | null;
  distanceM: number | null;
  timeDeltaHours: number | null;
  phashDistance: number | null;
  inliers: number | null;
}

export function readDuplicateMatch(evidence: unknown): DuplicateMatch | null {
  const match = obj(obj(evidence)?.match);
  const reportId = str(match?.report_id);
  if (!match || !reportId) return null;
  return {
    reportId,
    sameUser: typeof match.same_user === "boolean" ? match.same_user : null,
    imageIndex: num(match.image_index),
    distanceM: num(match.distance_m),
    timeDeltaHours: num(match.time_delta_hours),
    phashDistance: num(match.phash_distance),
    inliers: num(match.inliers),
  };
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
