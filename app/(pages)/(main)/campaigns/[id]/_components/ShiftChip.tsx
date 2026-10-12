import { Link } from '@/libs/router';

/** A shift as a small pill link to its page. */
export function ShiftChip({ campaignId, shift }: { campaignId: string; shift: { id: string; label: string } }) {
  return (
    <Link
      href={`/campaigns/${campaignId}/shifts/${shift.id}`}
      className="rounded-full border border-[rgba(136,122,71,0.4)] px-2 py-0.5 text-xs text-button-accent hover:bg-[#887A47]/10"
    >
      {shift.label}
    </Link>
  );
}
