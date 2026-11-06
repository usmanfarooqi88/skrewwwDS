import { cn } from "@/lib/cn";
import {
  STATUS_LABEL,
  formatVerifiedDate,
  getComparisonValue,
  type ComparisonCategory,
  type ComparisonGroup,
  type ComparisonSource,
  type ComparisonStatus,
  type ComparisonSystem,
  type ComparisonValue,
} from "@/lib/comparison";
import { ScrollRegion } from "@/components/compare/ScrollRegion";

type Props = {
  systems: readonly ComparisonSystem[];
  groups: readonly ComparisonGroup[];
  categories: readonly ComparisonCategory[];
  /** Source registry; values reference sources by id so each URL is written once. */
  sources: Readonly<Record<string, ComparisonSource>>;
};

const eyebrowClass = "font-mono text-xs font-semibold uppercase tracking-wide text-ink-500";

/** Decorative glyphs. The visible status word carries the meaning, never the glyph or its colour. */
function StatusGlyph({ status }: { status: ComparisonStatus }) {
  const common = { width: 16, height: 16, viewBox: "0 0 16 16", "aria-hidden": true, className: "mt-0.5 shrink-0" } as const;
  switch (status) {
    case "yes":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.75" className={cn(common.className, "text-success")}>
          <circle cx="8" cy="8" r="6.25" />
          <path d="m5.25 8.25 1.9 1.9 3.6-3.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "partial":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.75" className={cn(common.className, "text-warning")}>
          <circle cx="8" cy="8" r="6.25" />
          <path d="M8 1.75a6.25 6.25 0 0 1 0 12.5Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "no":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.75" className={cn(common.className, "text-ink-500")}>
          <circle cx="8" cy="8" r="6.25" />
          <path d="m5.75 5.75 4.5 4.5m0-4.5-4.5 4.5" strokeLinecap="round" />
        </svg>
      );
    case "na":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.75" className={cn(common.className, "text-ink-500")}>
          <circle cx="8" cy="8" r="6.25" />
          <path d="M5.5 8h5" strokeLinecap="round" />
        </svg>
      );
    case "unverified":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.75" className={cn(common.className, "text-ink-400")}>
          <circle cx="8" cy="8" r="6.25" strokeDasharray="2.2 2.4" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Native disclosure: works with keyboard and touch, needs no JavaScript, and expands in flow so it is
 * never clipped by the scroll region. Holds the note, the sources and the verification date.
 */
function SourceDetails({
  value,
  systemName,
  categoryLabel,
  sources,
}: {
  value: ComparisonValue;
  systemName: string;
  categoryLabel: string;
  sources: Readonly<Record<string, ComparisonSource>>;
}) {
  const resolved = (value.sources ?? [])
    .map((id) => sources[id])
    .filter((source): source is ComparisonSource => Boolean(source));
  if (resolved.length === 0 && !value.note) return null;
  return (
    <details className="group mt-1.5">
      <summary className="inline-flex min-h-6 cursor-pointer list-none items-center gap-1 rounded pr-1 text-xs font-medium text-brand-600 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 [&::-webkit-details-marker]:hidden">
        Source
        <span className="sr-only">
          {" "}
          and notes for {systemName}, {categoryLabel}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="transition-transform group-open:rotate-180"
        >
          <path d="m2 3.5 3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="mt-1.5 space-y-1.5 text-xs leading-snug text-ink-600">
        {value.note ? <p>{value.note}</p> : null}
        {resolved.length > 0 ? (
          <ul className="space-y-0.5">
            {resolved.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block py-1 font-medium text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                >
                  {source.name}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        {value.verifiedAt ? (
          <p className="text-ink-500">
            Verified <time dateTime={value.verifiedAt}>{formatVerifiedDate(value.verifiedAt)}</time>
          </p>
        ) : null}
      </div>
    </details>
  );
}

function ValueCell({
  value,
  systemName,
  categoryLabel,
  sources,
}: {
  value: ComparisonValue;
  systemName: string;
  categoryLabel: string;
  sources: Readonly<Record<string, ComparisonSource>>;
}) {
  const details = (
    <SourceDetails value={value} systemName={systemName} categoryLabel={categoryLabel} sources={sources} />
  );
  if (value.status === "fact") {
    return (
      <div>
        <p className="text-sm font-semibold text-ink-900">{value.label}</p>
        {details}
      </div>
    );
  }
  const statusText = STATUS_LABEL[value.status];
  const showLabel = value.status !== "unverified" && value.label;
  return (
    <div className="flex items-start gap-2">
      <StatusGlyph status={value.status} />
      <div className="min-w-0">
        <p className={cn("text-sm font-semibold", value.status === "unverified" ? "text-ink-500" : "text-ink-900")}>
          {statusText}
        </p>
        {showLabel ? <p className="mt-0.5 text-[13px] leading-snug text-ink-700">{value.label}</p> : null}
        {value.status !== "unverified" ? details : null}
      </div>
    </div>
  );
}

export function ComparisonTable({ systems, groups, categories, sources }: Props) {
  const columnCount = systems.length + 1;
  return (
    <ScrollRegion label="Design system comparison table (scrollable)">
      <table className="w-full min-w-[60rem] border-separate border-spacing-0 text-left">
        <caption className="sr-only">
          Capabilities of Skrewww, Carbon, Fluent 2, Spectrum and Atlassian Design System, grouped by
          area. A value of Not yet verified means no verified value is recorded for that system.
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-20 w-56 border-b border-r border-ink-200 bg-white px-4 py-3 align-bottom"
            >
              <span className={eyebrowClass}>Capability</span>
            </th>
            {systems.map((system) => (
              <th
                key={system.id}
                scope="col"
                className={cn(
                  "min-w-[10.5rem] border-b border-ink-200 px-4 py-3 align-bottom text-base font-semibold",
                  system.isSubject
                    ? "border-t-2 border-t-brand-500 bg-brand-50 text-brand-700"
                    : "text-ink-900",
                )}
              >
                {system.name}
              </th>
            ))}
          </tr>
        </thead>
        {groups.map((group) => {
          const rows = categories.filter((category) => category.group === group.id);
          if (rows.length === 0) return null;
          return (
            <tbody key={group.id}>
              <tr>
                <th
                  scope="rowgroup"
                  colSpan={columnCount}
                  className="sticky left-0 border-b border-ink-200 bg-ink-50 px-4 py-2 text-left"
                >
                  <span className={eyebrowClass}>{group.label}</span>
                </th>
              </tr>
              {rows.map((category) => (
                <tr key={category.id}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-b border-r border-ink-100 bg-white px-4 py-3 align-top text-left font-normal"
                  >
                    <span className="block text-sm font-medium text-ink-900">{category.label}</span>
                    {category.description ? (
                      <span className="mt-0.5 block text-xs leading-snug text-ink-500">
                        {category.description}
                      </span>
                    ) : null}
                  </th>
                  {systems.map((system) => (
                    <td
                      key={system.id}
                      className={cn(
                        "border-b border-ink-100 px-4 py-3 align-top",
                        system.isSubject && "bg-brand-50/60",
                      )}
                    >
                      <ValueCell
                        value={getComparisonValue(category, system.id)}
                        systemName={system.name}
                        categoryLabel={category.label}
                        sources={sources}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          );
        })}
      </table>
    </ScrollRegion>
  );
}
