"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/radio.module.css";

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, disabled, className, ...props },
  ref,
) {
  return (
    <label className={cn(styles.control, disabled && styles.controlDisabled, className)}>
      <input ref={ref} type="radio" className={styles.input} disabled={disabled} {...props} />
      <span className={styles.labelText}>{label}</span>
    </label>
  );
});
