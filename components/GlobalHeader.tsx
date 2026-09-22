"use client";

import { List } from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/Drawer";
import { HeaderNavLink } from "@/components/HeaderNavLink";
import { ResourcesMenu } from "@/components/ResourcesMenu";
import { SidebarNav } from "@/components/SidebarNav";
import { getActiveGlobalNavArea, globalNavItems, isResourcesPath, resourceLinks } from "@/lib/global-nav";

/**
 * The NAV-1 global header — the site's only top-level nav shell. Renders
 * once (in DocsChrome, not on `/reference/*`), and adapts responsively:
 * a full row on desktop, a logo + drawer trigger on mobile. Replaces the
 * old `MobileDocsNav` (that component is removed — its logo+hamburger+drawer
 * job is now this component's mobile mode).
 *
 * Search is deliberately absent — NAV-1 does not add it.
 */
export function GlobalHeader() {
  const pathname = usePathname();
  const activeArea = getActiveGlobalNavArea(pathname);
  const resourcesActive = isResourcesPath(pathname);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  function closeDrawer() {
    setDrawerOpen(false);
    queueMicrotask(() => menuButtonRef.current?.focus());
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/90 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="inline-flex shrink-0 items-center" aria-label="Skrewww home">
          <Image src="/logo.svg" alt="skrewww" width={590} height={161} className="h-6 w-auto" priority />
        </Link>

        <nav aria-label="Global" className="hidden items-center gap-6 lg:flex">
          {globalNavItems.map((item) => (
            <HeaderNavLink key={item.href} href={item.href} isActive={activeArea === item.area}>
              {item.label}
            </HeaderNavLink>
          ))}
          <ResourcesMenu isActive={resourcesActive} />
        </nav>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger>
            <button
              ref={menuButtonRef}
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-700 lg:hidden"
              aria-label="Open navigation menu"
            >
              <List size={18} aria-hidden="true" />
              Menu
            </button>
          </DrawerTrigger>
          <DrawerContent aria-label="Navigation">
            <DrawerTitle visuallyHidden>Navigation</DrawerTitle>
            <div className="flex shrink-0 justify-end px-5 pt-5">
              <DrawerClose className="min-h-11 min-w-11" />
            </div>
            <DrawerBody className="px-0 pb-6">
              <MobileGlobalLinks pathname={pathname} activeArea={activeArea} onNavigate={closeDrawer} />
              <SidebarNav onNavigate={closeDrawer} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </div>
    </header>
  );
}

/**
 * The four global-nav destinations plus the complete Resources set as a
 * flat list at the top of the mobile drawer. Guard and Changelog remain in
 * the unchanged contextual sidebar below for now; NAV-2 owns that cleanup.
 */
function MobileGlobalLinks({
  pathname,
  activeArea,
  onNavigate,
}: {
  pathname: string;
  activeArea: ReturnType<typeof getActiveGlobalNavArea>;
  onNavigate: () => void;
}) {
  const linkClass = (isActive: boolean) =>
    `block border-l-2 px-3 py-1.5 text-sm transition-colors ${
      isActive ? "border-brand-500 font-medium text-ink-900" : "border-transparent text-ink-600 hover:text-ink-900"
    }`;
  return (
    <nav aria-label="Global" className="mb-4 border-b border-ink-200 px-3 pb-4">
      {globalNavItems.map((item) => (
        <Link key={item.href} href={item.href} onClick={onNavigate} className={linkClass(activeArea === item.area)}>
          {item.label}
        </Link>
      ))}
      <div className="mt-3 space-y-0.5 border-t border-ink-200 pt-3">
        <div className="px-3 pb-1 font-mono text-[11px] font-medium uppercase tracking-wide text-ink-400">
          Resources
        </div>
        {resourceLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noopener noreferrer" : undefined}
            aria-current={!link.external && pathname === link.href ? "page" : undefined}
            onClick={onNavigate}
            className={linkClass(!link.external && pathname === link.href)}
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
