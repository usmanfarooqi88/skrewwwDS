import { SidebarNav } from "@/components/SidebarNav";

/**
 * Positioned below the global header (top-14, matching its h-14 height),
 * not the page's own top edge — see GlobalHeader. No logo of its own: the
 * header now owns Home/logo, and a second logo directly under it would be
 * an obvious visual duplicate (NAV-1 Part 8).
 */
export function Sidebar() {
  return (
    <aside className="fixed bottom-0 left-0 top-14 z-20 hidden w-64 overflow-y-auto border-r border-ink-200 bg-white/80 backdrop-blur-sm md:block">
      <SidebarNav />
    </aside>
  );
}
