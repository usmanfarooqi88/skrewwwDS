import Link from "next/link";
import type { ComponentDirectoryEntry } from "@/lib/component-directory";

const statusStyles = {
  stable: "bg-success/10 text-success",
  beta: "bg-warning/10 text-warning",
  "docs-only": "bg-ink-100 text-ink-600",
} as const;

const statusLabels = {
  stable: "Stable",
  beta: "Beta",
  "docs-only": "Docs only",
} as const;

export function ComponentDirectoryList({ entries }: { entries: ComponentDirectoryEntry[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 border-t border-ink-200 sm:grid-cols-2">
      {entries.map((entry) => (
        <li key={entry.slug} className="border-b border-ink-200">
          <Link
            href={entry.href}
            className="flex min-h-12 items-center justify-between gap-3 rounded-sm px-1 py-2.5 text-sm transition-colors hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            <span className="font-medium text-ink-900">{entry.name}</span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide ${statusStyles[entry.status]}`}
            >
              {statusLabels[entry.status]}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
