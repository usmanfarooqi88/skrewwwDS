"use client";

import { List } from "@phosphor-icons/react";
import { useState } from "react";
import { SectionNav } from "@/components/SectionNav";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/Drawer";
import type { SectionNavModel } from "@/lib/section-nav";

export function MobileSectionNav({ model }: { model: SectionNavModel }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-ink-200 bg-white px-4 py-2 md:hidden">
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger>
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-ink-200 px-3 text-sm font-medium text-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            aria-label={`Open ${model.label} section navigation`}
          >
            <List size={18} aria-hidden="true" />
            {model.label} section
          </button>
        </DrawerTrigger>
        <DrawerContent aria-label={`${model.label} section navigation`}>
          <DrawerTitle visuallyHidden>{model.label} section navigation</DrawerTitle>
          <div className="flex shrink-0 justify-end px-5 pt-5">
            <DrawerClose className="min-h-11 min-w-11" />
          </div>
          <DrawerBody className="px-0 pb-6">
            <SectionNav model={model} onNavigate={() => setOpen(false)} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
