"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  isReferenceNavItemActive,
  REFERENCE_NAV_ITEMS,
} from "@/lib/reference-app/nav";

type ReferenceNavProps = {
  onNavigate?: () => void;
  id?: string;
};

export function ReferenceNav({ onNavigate, id }: ReferenceNavProps) {
  const pathname = usePathname();

  return (
    <nav id={id} aria-label="Reference app" className="px-3 py-4">
      <ul className="flex flex-col gap-1">
        {REFERENCE_NAV_ITEMS.map((item) => {
          const isActive = isReferenceNavItemActive(pathname, item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onNavigate?.()}
                className={cn(
                  "block rounded-md border-l-2 px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "border-brand-500 bg-ink-50 font-medium text-ink-900"
                    : "border-transparent text-ink-600 hover:bg-ink-50 hover:text-ink-900",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
