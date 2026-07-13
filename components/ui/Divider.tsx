import { createElement, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/divider.module.css";

export type DividerOrientation = "horizontal" | "vertical";
export type DividerVariant = "thematic" | "decorative" | "structural";

export type DividerProps = HTMLAttributes<HTMLElement> & {
  orientation?: DividerOrientation;
  variant?: DividerVariant;
};

export function Divider({
  orientation = "horizontal",
  variant = "thematic",
  className,
  ...props
}: DividerProps) {
  const isVertical = orientation === "vertical";

  if (variant === "thematic") {
    return createElement("hr", {
      ...props,
      className: cn(
        styles.divider,
        isVertical ? styles.vertical : styles.horizontal,
        className,
      ),
      "aria-orientation": isVertical ? "vertical" : undefined,
    });
  }

  if (variant === "decorative") {
    return createElement("div", {
      ...props,
      role: "presentation",
      "aria-hidden": true,
      className: cn(
        styles.divider,
        isVertical ? styles.vertical : styles.horizontal,
        className,
      ),
    });
  }

  return createElement("div", {
    ...props,
    role: "separator",
    "aria-orientation": isVertical ? "vertical" : "horizontal",
    className: cn(
      styles.divider,
      isVertical ? styles.vertical : styles.horizontal,
      className,
    ),
  });
}
