"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ValidationMessage } from "@/components/ui/ValidationMessage";
import styles from "@/components/ui/form-field.module.css";

export type FormFieldProps = {
  label: string;
  controlId?: string;
  required?: boolean;
  hideLabel?: boolean;
  supportingText?: string;
  error?: string;
  className?: string;
  children: (args: {
    controlId: string;
    describedBy?: string;
    invalid?: boolean;
  }) => ReactNode;
};

export function FormField({
  label,
  controlId,
  required = false,
  hideLabel = false,
  supportingText,
  error,
  className,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const supportingId = supportingText ? `${id}-supporting` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, !error ? supportingId : undefined].filter(Boolean).join(" ");

  return (
    <div className={cn(styles.field, className)}>
      <label htmlFor={id} className={hideLabel ? styles.srOnly : styles.label}>
        {label}
        {required ? (
          <>
            <span className={styles.required} aria-hidden="true">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </label>

      {children({
        controlId: id,
        describedBy: describedBy || undefined,
        invalid: Boolean(error),
      })}

      {error ? (
        <ValidationMessage id={errorId} type="error" announce="off">
          {error}
        </ValidationMessage>
      ) : supportingText ? (
        <p id={supportingId} className={styles.supporting}>
          {supportingText}
        </p>
      ) : null}
    </div>
  );
}
