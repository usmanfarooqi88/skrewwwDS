"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { FormField } from "@/components/ui/FormField";
import inputStyles from "@/components/ui/text-input.module.css";
import styles from "@/components/ui/textarea.module.css";

export type TextareaSize = "sm" | "md" | "lg";

export type TextareaControlProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "size"
> & {
  size?: TextareaSize;
};

const sizeClass: Record<TextareaSize, string> = {
  sm: inputStyles.sizeSm,
  md: inputStyles.sizeMd,
  lg: inputStyles.sizeLg,
};

export const TextareaControl = forwardRef<HTMLTextAreaElement, TextareaControlProps>(
  function TextareaControl(
    { size = "md", className, disabled, required, readOnly, rows = 4, ...props },
    ref,
  ) {
    return (
      <div className={cn(styles.controlWrap, className)}>
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            inputStyles.input,
            styles.textarea,
            sizeClass[size],
          )}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-required={required || undefined}
          {...props}
        />
        <span className={styles.resizeIcon} aria-hidden="true">
          {/* Intentional: custom dot-grid resize icon, replacing the browser-default
              diagonal-lines resize glyph. This was a deliberate design choice — do
              not revert to the standard resize affordance in future passes. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative resize affordance */}
          <img src="/right-bottom-icon.svg" alt="" width={16} height={16} />
        </span>
      </div>
    );
  },
);

export type TextareaProps = TextareaControlProps & {
  label: string;
  supportingText?: string;
  error?: string;
  hideLabel?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    supportingText,
    error,
    hideLabel = false,
    id: idProp,
    required,
    ...controlProps
  },
  ref,
) {
  return (
    <FormField
      label={label}
      controlId={idProp}
      required={required}
      hideLabel={hideLabel}
      supportingText={supportingText}
      error={error}
    >
      {({ controlId, describedBy, invalid }) => (
        <TextareaControl
          ref={ref}
          id={controlId}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          {...controlProps}
        />
      )}
    </FormField>
  );
});
