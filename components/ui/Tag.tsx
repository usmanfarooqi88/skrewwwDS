"use client";

import { X } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/tag.module.css";

export type TagProps = {
  children: ReactNode;
  removable?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
  leadingIcon?: ReactNode;
  className?: string;
};

export function Tag({
  children,
  removable = false,
  onRemove,
  removeLabel,
  leadingIcon,
  className,
}: TagProps) {
  const labelText = typeof children === "string" ? children : undefined;
  const accessibleRemoveLabel = removeLabel ?? (labelText ? `Remove ${labelText}` : "Remove tag");

  return (
    <span className={cn(styles.tag, className)}>
      {leadingIcon ? (
        <span className={styles.leadingIcon} aria-hidden="true">
          {leadingIcon}
        </span>
      ) : null}
      <span className={styles.label}>{children}</span>
      {removable ? (
        <button
          type="button"
          className={styles.remove}
          aria-label={accessibleRemoveLabel}
          onClick={onRemove}
        >
          <X size={12} aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
}
