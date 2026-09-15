import Link from "next/link";
import { ReferenceBannerSpacer } from "@/components/reference-app/ReferenceBannerSpacer";
import { ReferenceMobileHeader } from "@/components/reference-app/ReferenceMobileHeader";
import { ReferenceNav } from "@/components/reference-app/ReferenceNav";
import { ReferenceUserMenu } from "@/components/reference-app/ReferenceUserMenu";
import styles from "@/components/reference-app/reference-shell.module.css";
import { Button } from "@/components/ui/Button";

export function ReferenceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-50 text-ink-900">
      <a href="#reference-main" className={styles.skipLink}>
        Skip to content
      </a>

      <ReferenceMobileHeader />

      <aside
        className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-ink-200 bg-white md:flex"
        aria-label="Reference app sidebar"
      >
        <div className="flex h-16 shrink-0 items-center border-b border-ink-200 px-5">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500">
              Ops Console
            </p>
            <Link
              href="/reference"
              className="truncate text-sm font-semibold text-ink-900 hover:text-brand-600"
            >
              Skrewww Reference
            </Link>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ReferenceNav />
        </div>
        <div className="shrink-0 border-t border-ink-200 p-4">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              aria-label="Notifications (coming later)"
              disabled
            >
              Alerts
            </Button>
            <ReferenceUserMenu />
          </div>
        </div>
      </aside>

      {/*
        overflow-x-clip keeps wide TableScrollArea content from inflating
        document/page horizontal scroll while local table scroll still works.
      */}
      <div className="min-w-0 overflow-x-clip md:ml-64">
        <main
          id="reference-main"
          tabIndex={-1}
          className="min-h-screen min-w-0 overflow-x-clip outline-none"
        >
          {children}
          <ReferenceBannerSpacer />
        </main>
      </div>
    </div>
  );
}
