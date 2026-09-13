import type { NavBadgeStatus } from "@/lib/sidebar-nav";

const NAV_BADGE_LABEL: Record<NavBadgeStatus, string> = {
  new: "New",
  updated: "Updated",
  beta: "Beta",
  pro: "Pro",
};

export function NavBadge({ status }: { status: NavBadgeStatus }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase leading-none tracking-wide text-brand-600">
      {NAV_BADGE_LABEL[status]}
    </span>
  );
}
