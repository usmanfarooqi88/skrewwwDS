"use client";

import { useRouter } from "next/navigation";
import { useCallback, type ReactNode } from "react";
import { SkrewwwRouterProvider } from "@/components/ui/router-navigation";

/**
 * The docs application's Next.js adapter for Skrewww's router contract.
 * Canonical components render native anchors and know nothing about Next;
 * this is the only place the docs app connects them to `next/navigation`, so
 * internal Skrewww links keep client-side navigation. It is application
 * integration, deliberately outside `components/ui` and the npm package.
 */
export function NextRouterIntegration({ children }: { children: ReactNode }) {
  const router = useRouter();
  const navigate = useCallback((href: string) => router.push(href), [router]);
  return <SkrewwwRouterProvider navigate={navigate}>{children}</SkrewwwRouterProvider>;
}
