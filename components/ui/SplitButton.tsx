"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ButtonGroupContext } from "@/components/ui/button-group-context";
import styles from "@/components/ui/button-group.module.css";

/**
 * Chrome divider color visible in the 2px gap between primary action and
 * menu trigger. Matches Figma Style’s gap fill (same tokens as Button Group).
 * - neutral → Secondary Style (semantic/border/default)
 * - primary → Primary Style (color/brand/700)
 * - danger → Danger Style (color/danger/700)
 */
export type SplitButtonDivider = "neutral" | "primary" | "danger";

export type SplitButtonProps = {
  /**
   * Composition: one primary `Button` plus a `Menu` whose `MenuTrigger`
   * wraps a secondary `Button` (typically icon-only CaretDown with aria-label).
   * Split Button does not own Button or Menu props.
   */
  children: ReactNode;
  /**
   * Accessible name for the related primary + menu pair.
   * Prefer when there is no visible group label.
   */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /** Gap/chrome divider tone. Default matches Figma Secondary Style. */
  divider?: SplitButtonDivider;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label" | "aria-labelledby">;

const dividerClass: Record<SplitButtonDivider, string> = {
  neutral: styles.dividerNeutral,
  primary: styles.dividerPrimary,
  danger: styles.dividerDanger,
};

/**
 * Joined visual pair: one primary Button action + a related Menu trigger.
 *
 * Button remains the authority for the primary action. Menu / MenuTrigger
 * remain the authority for popup/menu behavior. This component only owns
 * adjacency chrome (shared outer border, 2px divider gap, outer corners).
 *
 * Not Button Group (peer actions), not Toggle Group, not a menu framework.
 */
export function SplitButton({
  children,
  className,
  divider = "neutral",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...rest
}: SplitButtonProps) {
  return (
    <ButtonGroupContext.Provider value={true}>
      <div
        role="group"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={cn(styles.group, dividerClass[divider], className)}
        {...rest}
      >
        {children}
      </div>
    </ButtonGroupContext.Provider>
  );
}
