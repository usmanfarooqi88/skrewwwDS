"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ButtonGroupContext } from "@/components/ui/button-group-context";
import styles from "@/components/ui/button-group.module.css";

/**
 * Chrome divider color visible in the 2px gap between joined buttons.
 * Matches Figma Style’s gap fill (not a Button variant prop).
 * - neutral → Secondary Style (semantic/border/default)
 * - primary → Primary Style (color/brand/700)
 * - danger → Danger Style (color/danger/700)
 */
export type ButtonGroupDivider = "neutral" | "primary" | "danger";

export type ButtonGroupProps = {
  children: ReactNode;
  /**
   * Accessible name for the group of related actions.
   * Prefer when there is no visible group label.
   */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /** Gap/chrome divider tone. Default matches Figma Secondary Style. */
  divider?: ButtonGroupDivider;
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "aria-label" | "aria-labelledby">;

const dividerClass: Record<ButtonGroupDivider, string> = {
  neutral: styles.dividerNeutral,
  primary: styles.dividerPrimary,
  danger: styles.dividerDanger,
};

/**
 * Joined visual group of independent Skrewww Buttons.
 *
 * Button remains the authority for each action. This component only owns
 * adjacency chrome (shared outer border, 2px divider gap, outer corners).
 * It does not implement selection, toggle, or radiogroup semantics.
 */
export function ButtonGroup({
  children,
  className,
  divider = "neutral",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...rest
}: ButtonGroupProps) {
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
