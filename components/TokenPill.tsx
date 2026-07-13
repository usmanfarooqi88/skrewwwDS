import { tokenColorMap } from "@/lib/data";

export function TokenPill({ token }: { token: string }) {
  const color = tokenColorMap[token];
  const hasColor = Boolean(color);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-2 py-0.5 font-mono text-[11px] text-ink-700 shadow-sm">
      {hasColor && (
        <span
          className="h-2.5 w-2.5 rounded-full border border-black/10"
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
    <div className="flex flex-wrap gap-1.5">
      {tokens.map((t) => (
        <TokenPill key={t} token={t} />
      ))}
    </div>
  );
}
