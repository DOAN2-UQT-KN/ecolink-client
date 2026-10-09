import { ReactNode } from "react";

export function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="w-[200px] shrink-0 text-sm text-foreground-tertiary">
        {label}
      </span>
      <div className="min-w-0 flex-1 text-sm break-words">{value || "—"}</div>
    </div>
  );
}

/**
 * Several values under one label, as bullets. A single value is drawn as-is, so a label with
 * one entry looks exactly like a plain row.
 */
export function SummaryList({ items }: { items: { key: string; node: ReactNode }[] }) {
  if (items.length === 0) return null;
  if (items.length === 1) return <>{items[0].node}</>;
  return (
    <ul className="flex list-disc flex-col gap-1 pl-5">
      {items.map((item) => (
        <li key={item.key}>{item.node}</li>
      ))}
    </ul>
  );
}
