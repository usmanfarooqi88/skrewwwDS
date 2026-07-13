import { DocSection } from "@/components/DocSection";
import { CopyCodeButton } from "@/components/docs/CopyCodeButton";
import { getRegistryEntry } from "@/lib/component-registry";

export function ComponentApiSection({ slug }: { slug: string }) {
  const entry = getRegistryEntry(slug);
  if (!entry?.hasImplementation) return null;

  return (
    <>
      <DocSection label="Component API">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-ink-500">
                <th className="py-2 pr-4 font-mono text-[11px] font-medium uppercase tracking-wide">
                  Prop
                </th>
                <th className="py-2 pr-4 font-mono text-[11px] font-medium uppercase tracking-wide">
                  Type
                </th>
                <th className="py-2 pr-4 font-mono text-[11px] font-medium uppercase tracking-wide">
                  Default
                </th>
                <th className="py-2 font-mono text-[11px] font-medium uppercase tracking-wide">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {entry.apiProps.map((prop) => (
                <tr key={prop.name} className="border-b border-ink-100 align-top">
                  <td className="py-2.5 pr-4 font-mono text-xs text-brand-600">{prop.name}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-ink-600">{prop.type}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-ink-400">
                    {prop.default ?? "—"}
                  </td>
                  <td className="py-2.5 text-ink-700">{prop.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection label="React example">
        <CopyCodeButton code={entry.reactExample} />
        <pre className="overflow-x-auto rounded-md bg-ink-900 p-4 font-mono text-xs leading-relaxed text-ink-0">
          <code>{entry.reactExample}</code>
        </pre>
      </DocSection>
    </>
  );
}
