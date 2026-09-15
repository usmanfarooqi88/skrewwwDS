"use client";

import { List } from "@phosphor-icons/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { ReferenceNav } from "@/components/reference-app/ReferenceNav";
import { ReferenceUserMenu } from "@/components/reference-app/ReferenceUserMenu";
import { Button } from "@/components/ui/Button";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/Drawer";

export function ReferenceMobileHeader() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);

  function closeDrawer() {
    setOpen(false);
    queueMicrotask(() => menuRef.current?.focus());
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/95 backdrop-blur-sm md:hidden">
      <div className="flex h-14 items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger>
              <button
                ref={menuRef}
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-700"
                aria-label="Open navigation"
              >
                <List size={18} aria-hidden="true" />
                Menu
              </button>
            </DrawerTrigger>
            <DrawerContent aria-label="Reference app navigation">
              <DrawerTitle visuallyHidden>Reference app navigation</DrawerTitle>
              <div className="flex shrink-0 justify-end px-5 pt-5">
                <DrawerClose className="min-h-11 min-w-11" />
              </div>
              <DrawerBody className="px-0 pb-6">
                <div className="border-b border-ink-200 px-5 pb-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                    Ops Console
                  </p>
                  <Link
                    href="/reference"
                    className="mt-1 block text-base font-semibold text-ink-900"
                    onClick={closeDrawer}
                  >
                    Skrewww Reference
                  </Link>
                </div>
                <ReferenceNav onNavigate={closeDrawer} />
              </DrawerBody>
            </DrawerContent>
          </Drawer>
          <Link
            href="/reference"
            className="truncate text-sm font-semibold text-ink-900"
          >
            Ops Console
          </Link>
        </div>
        <div className="flex items-center gap-2">
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
    </header>
  );
}
