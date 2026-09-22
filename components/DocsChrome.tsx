"use client";

import { usePathname } from "next/navigation";
import { GlobalHeader } from "@/components/GlobalHeader";
import { Sidebar } from "@/components/Sidebar";

/**
 * Isolates the docs site chrome from `/reference/*` so the Reference App can
 * compose its own product shell without duplicating or forking docs navigation.
 */
export function DocsChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isReferenceApp = pathname === "/reference" || pathname.startsWith("/reference/");

  if (isReferenceApp) {
    return <>{children}</>;
  }

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-2 z-50 -translate-y-16 rounded-md bg-white px-3 py-2 text-sm font-medium text-ink-900 shadow-md transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        Skip to content
      </a>
      <GlobalHeader />
      <Sidebar />
      <main id="main-content" tabIndex={-1} className="min-h-screen md:ml-64">
        {children}
      </main>
    </>
  );
}
