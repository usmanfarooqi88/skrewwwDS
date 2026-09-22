"use client";

import { CaretDown } from "@phosphor-icons/react";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/Menu";
import { resourceLinks } from "@/lib/global-nav";
import { cn } from "@/lib/cn";

/**
 * The locked NAV-1 Resources menu — Guard, Changelog, GitHub, Figma Free,
 * Figma Pro (see lib/global-nav.ts). Reuses the canonical Menu/MenuItem
 * primitives unmodified (aside from MenuItem's own additive target/rel
 * support) rather than a hand-rolled dropdown, so keyboard traversal,
 * Escape, and focus restoration are the same, already-tested behavior
 * every other Menu instance in the app gets.
 *
 * Visually, the trigger is a plain text nav item (same Tabs-token
 * treatment as `HeaderNavLink` — see that file's doc comment) rather than
 * an outlined Button, so Resources reads as one of the header's primary
 * nav items instead of a visually separate control. A small caret marks
 * it as a menu trigger. Only the trigger's *appearance* changes here —
 * `aria-haspopup="menu"` etc. still come from `MenuTrigger` itself.
 */
export function ResourcesMenu({ isActive, onNavigate }: { isActive: boolean; onNavigate?: () => void }) {
  return (
    <Menu>
      <MenuTrigger>
        <button
          type="button"
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "relative flex h-full items-center gap-1 whitespace-nowrap px-[var(--tab-padding-x)] text-[length:var(--tab-font-size)] font-medium transition-colors duration-[var(--tab-transition-duration)] ease-out",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--semantic-focus-ring)]",
            isActive
              ? "text-[var(--tab-active-text)] after:absolute after:inset-x-[var(--tab-padding-x)] after:bottom-0 after:h-[var(--tab-indicator-thickness)] after:rounded-full after:bg-[var(--tab-active-indicator)] after:content-['']"
              : "text-[var(--tab-text)] hover:text-[var(--tab-active-text)]",
          )}
        >
          Resources
          <CaretDown size={14} weight="bold" aria-hidden="true" />
        </button>
      </MenuTrigger>
      <MenuContent aria-label="Resources">
        {resourceLinks.map((link) =>
          link.external ? (
            <MenuItem key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" onSelect={onNavigate}>
              {link.label}
            </MenuItem>
          ) : (
            <MenuItem key={link.label} href={link.href} onSelect={onNavigate}>
              {link.label}
            </MenuItem>
          ),
        )}
      </MenuContent>
    </Menu>
  );
}
