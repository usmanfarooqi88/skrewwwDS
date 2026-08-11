import { tokenColorMap } from "@/lib/data";

export function TokenPill({ token }: { token: string }) {
  const color = tokenColorMap[token];
  const hasColor = Boolean(color);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-2.5 py-1 font-mono text-xs text-ink-700 shadow-sm sm:px-2 sm:py-0.5 sm:text-[11px]">
      {hasColor && (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10"
          style={{ backgroundColor: color }}
          aria-hidden
        />
      )}
      {token}
    </span>
  );
}

export function TokenPillRow({ tokens }: { tokens: string[] }) {
  return (
    <div className="flex flex-wrap gap-2 sm:gap-1.5">
      {tokens.map((t) => (
        <TokenPill key={t} token={t} />
      ))}
    </div>
  );
}
