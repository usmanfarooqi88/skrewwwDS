import { ReactNode } from "react";

const accentMap: Record<string, string> = {
  default: "border-ink-200",
  danger: "border-danger/40 bg-danger/5",
  info: "border-info/40 bg-info/5",
};

export function DocSection({
  label,
  children,
  tone = "default",
}: {
  label: string;
  children: ReactNode;
  tone?: "default" | "danger" | "info";
}) {
  return (
    <section className={`rounded-lg border p-4 ${accentMap[tone]}`}>
      <h3 className="mb-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-ink-400">
        {label}
      </h3>
      <div className="min-w-0 max-w-full text-sm leading-relaxed text-ink-700 [overflow-wrap:anywhere]">
        {children}
      </div>
    </section>
  );
}
