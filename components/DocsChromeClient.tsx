"use client";

import { usePathname } from "next/navigation";
import { GlobalHeader } from "@/components/GlobalHeader";
import { MobileSectionNav } from "@/components/MobileSectionNav";
import { SectionSidebar } from "@/components/SectionSidebar";
import { resolveSection, type Section, type SectionNavModel } from "@/lib/section-nav";
import { cn } from "@/lib/cn";

/**
 * Client half of the docs chrome (needs `usePathname`). Receives the prebuilt
 * navigation models from the server `DocsChrome`.
 *
 * Isolates the docs site chrome from `/reference/*` so the Reference App can
 * compose its own product shell without duplicating or forking docs navigation.
 */
export function DocsChromeClient({
  children,
  models,
}: {
  children: React.ReactNode;
  models: Record<Section, SectionNavModel>;
}) {
  const pathname = usePathname();
  const isReferenceApp = pathname === "/reference" || pathname.startsWith("/reference/");
  const section = resolveSection(pathname);
  const sectionNav = section ? models[section] : null;

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
      {sectionNav ? <SectionSidebar model={sectionNav} /> : null}
      {sectionNav ? <MobileSectionNav model={sectionNav} /> : null}
      <main id="main-content" tabIndex={-1} className={cn("min-h-screen", sectionNav && "md:ml-64")}>
        {children}
      </main>
    </>
  );
}
