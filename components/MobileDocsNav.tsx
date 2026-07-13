"use client";

import { List } from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/Drawer";
import { SidebarNav } from "@/components/SidebarNav";

export function MobileDocsNav() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);

  function closeDrawer() {
    setOpen(false);
    queueMicrotask(() => menuRef.current?.focus());
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/90 backdrop-blur-sm md:hidden">
      <div className="flex h-14 items-center justify-between gap-3 px-4">
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/logo.svg"
            alt="skrewww"
            width={590}
            height={161}
            className="h-5 w-auto"
            priority
          />
        </Link>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger>
            <button
              ref={menuRef}
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-700"
              aria-label="Open documentation menu"
            >
              <List size={18} aria-hidden="true" />
              Menu
            </button>
          </DrawerTrigger>
          <DrawerContent aria-label="Documentation navigation">
            <DrawerTitle visuallyHidden>Documentation navigation</DrawerTitle>
            <DrawerClose />
            <DrawerBody className="px-0 pb-6">
              <SidebarNav onNavigate={closeDrawer} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </div>
    </header>
  );
}
