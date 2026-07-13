"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import { useControllableState } from "@/lib/use-controllable";
import { Radio } from "@/components/ui/Radio";
import { ValidationMessage } from "@/components/ui/ValidationMessage";
import styles from "@/components/ui/radio.module.css";

export type RadioGroupOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type RadioGroupProps = {
  name?: string;
  label: string;
  options: RadioGroupOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  supportingText?: string;
  error?: string;
  className?: string;
};

export function RadioGroup({
  name: nameProp,
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  required = false,
  disabled = false,
  supportingText,
  error,
  className,
}: RadioGroupProps) {
  const generatedName = useId();
  const name = nameProp ?? generatedName.replace(/:/g, "");
  const groupId = `${name}-group`;
  const supportingId = supportingText ? `${groupId}-supporting` : undefined;
  const errorId = error ? `${groupId}-error` : undefined;
  const describedBy = [errorId, !error ? supportingId : undefined].filter(Boolean).join(" ");

  const [selected, setSelected] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  });

  return (
    <fieldset
      className={cn(styles.group, className)}
      aria-describedby={describedBy || undefined}
      aria-invalid={error ? true : undefined}
      aria-required={required || undefined}
      disabled={disabled || undefined}
    >
      <legend className={styles.legend}>
        {label}
        {required ? (
          <>
            <span className={styles.required} aria-hidden="true">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </legend>

      <div className={styles.options} role="presentation">
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            checked={selected === option.value}
            disabled={disabled || option.disabled}
            aria-invalid={error ? true : undefined}
            onChange={() => setSelected(option.value)}
          />
        ))}
      </div>

      {error ? (
        <ValidationMessage id={errorId} type="error" announce="off">
          {error}
        </ValidationMessage>
      ) : supportingText ? (
        <p id={supportingId} className={styles.supporting}>
          {supportingText}
        </p>
      ) : null}
    </fieldset>
  );
}
