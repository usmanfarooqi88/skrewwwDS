"use client";

import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/Menu";
import { Button } from "@/components/ui/Button";
import { resourceLinks } from "@/lib/global-nav";
import { cn } from "@/lib/cn";

/**
 * The locked NAV-1 Resources menu — Guard, Changelog, GitHub, Figma Free,
 * Figma Pro (see lib/global-nav.ts). Reuses the canonical Menu/MenuItem
 * primitives unmodified (aside from MenuItem's own additive target/rel
 * support) rather than a hand-rolled dropdown, so keyboard traversal,
 * Escape, and focus restoration are the same, already-tested behavior
 * every other Menu instance in the app gets.
 */
export function ResourcesMenu({ isActive, onNavigate }: { isActive: boolean; onNavigate?: () => void }) {
  return (
    // The border lives on this plain wrapper, not on Button itself — Button's
    // real border/fill is drawn by an internal .visualSurface element that a
    // passed-in className can't safely reach, so the active indicator is a
    // border around the trigger rather than a restyle of the primitive.
    <div className={cn("border-b-2 pb-0.5", isActive ? "border-brand-500" : "border-transparent")}>
      <Menu>
        <MenuTrigger>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-current={isActive ? "page" : undefined}
          >
            Resources
          </Button>
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
    </div>
  );
}
