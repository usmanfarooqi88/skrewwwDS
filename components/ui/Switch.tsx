"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import { useControllableState } from "@/lib/use-controllable";
import styles from "@/components/ui/switch.module.css";

export type SwitchProps = {
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-describedby"?: string;
};

export function Switch({
  label,
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  id: idProp,
  className,
  "aria-describedby": ariaDescribedBy,
}: SwitchProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const labelId = `${id}-label`;

  const [isOn, setIsOn] = useControllableState({
    value: checked,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  });

  function handleClick() {
    if (disabled) return;
    setIsOn(!isOn);
  }

  return (
    <div className={cn(styles.control, disabled && styles.controlDisabled, className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-labelledby={labelId}
        aria-describedby={ariaDescribedBy}
        disabled={disabled}
        className={cn(
          styles.switch,
          isOn && styles.switchOn,
          disabled && styles.switchDisabled,
        )}
        onClick={handleClick}
      >
        <span className={cn(styles.thumb, isOn && styles.thumbOn)} aria-hidden="true" />
      </button>
      <span id={labelId} className={styles.labelText}>
        {label}
      </span>
    </div>
  );
}
