"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/text-input.module.css";

export type TextInputControlSize = "sm" | "md" | "lg";

export type TextInputControlProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> & {
  size?: TextInputControlSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  trailingAction?: ReactNode;
};

const sizeClass: Record<TextInputControlSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

/** Control-only single-line input — compose with FormField for label and validation. */
export const TextInputControl = forwardRef<HTMLInputElement, TextInputControlProps>(
  function TextInputControl(
    {
      size = "md",
      leadingIcon,
      trailingIcon,
      trailingAction,
      className,
      disabled,
      required,
      readOnly,
      ...props
    },
    ref,
  ) {
    return (
      <div className={cn(styles.controlWrap, className)}>
        {leadingIcon ? (
          <span className={styles.leading} aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}

        <input
          ref={ref}
          className={cn(
            styles.input,
            sizeClass[size],
            leadingIcon ? styles.withLeading : undefined,
            trailingIcon || trailingAction ? styles.withTrailing : undefined,
          )}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-required={required || undefined}
          {...props}
        />

        {trailingAction ? (
          <span className={styles.trailingAction}>{trailingAction}</span>
        ) : trailingIcon ? (
          <span className={styles.trailing} aria-hidden="true">
            {trailingIcon}
          </span>
        ) : null}
      </div>
    );
  },
);
