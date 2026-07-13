"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type InputHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/checkbox.module.css";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  indeterminate?: boolean;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, indeterminate = false, disabled, className, id, ...props },
  forwardedRef,
) {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label
      className={cn(styles.control, disabled && styles.controlDisabled, className)}
    >
      <input
        ref={inputRef}
        id={id}
        type="checkbox"
        className={styles.input}
        disabled={disabled}
        {...props}
      />
      <span className={styles.labelText}>{label}</span>
    </label>
  );
});
