import { SectionNav } from "@/components/SectionNav";
import type { SectionNavModel } from "@/lib/section-nav";

export function SectionSidebar({ model }: { model: SectionNavModel }) {
  return (
    <aside
      aria-label={`${model.label} section sidebar`}
      className="fixed bottom-0 left-0 top-14 z-20 hidden w-64 overflow-y-auto border-r border-ink-200 bg-white/80 backdrop-blur-sm md:block"
    >
      <SectionNav model={model} />
    </aside>
  );
}
