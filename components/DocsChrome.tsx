"use client";

import { usePathname } from "next/navigation";
import { MobileDocsNav } from "@/components/MobileDocsNav";
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
      <Sidebar />
      <MobileDocsNav />
      <main className="min-h-screen md:ml-64">{children}</main>
    </>
  );
}
