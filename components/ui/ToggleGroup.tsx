"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { useControllableState } from "@/lib/use-controllable";
import { handleToggleGroupKeyDown } from "@/components/ui/internal/toggle-group-keyboard";
import styles from "@/components/ui/toggle-group.module.css";

export type ToggleGroupSize = "sm" | "md" | "lg";
export type ToggleGroupOrientation = "horizontal" | "vertical";

type ToggleGroupContextValue = {
  value: string;
  setValue: (next: string) => void;
  disabled: boolean;
  orientation: ToggleGroupOrientation;
  size: ToggleGroupSize;
  registerItem: (value: string) => () => void;
  orderedValues: string[];
};

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);

function useToggleGroupContext(component: string): ToggleGroupContextValue {
  const context = useContext(ToggleGroupContext);
  if (!context) {
    throw new Error(`${component} must be used within ToggleGroup`);
  }
  return context;
}

export type ToggleGroupProps = {
  /**
   * Selected item value. Prefer a concrete default for radiogroup UX.
   * Empty string means none selected yet (first enabled item remains tabbable).
   */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  orientation?: ToggleGroupOrientation;
  size?: ToggleGroupSize;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
  children: ReactNode;
};

/**
 * Exclusive selection control with segmented / joined chrome.
 *
 * Single-selection only (`role="radiogroup"` + `role="radio"`).
 * “Segmented Control” is this presentation — not a separate Skrewww component.
 *
 * Not Button Group (peer actions), not Radio Group (form field radios),
 * not Tabs (content panels).
 */
export function ToggleGroup({
  value,
  defaultValue = "",
  onValueChange,
  disabled = false,
  orientation = "horizontal",
  size = "md",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
  children,
}: ToggleGroupProps) {
  const [current, setCurrent] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const [orderedValues, setOrderedValues] = useState<string[]>([]);

  const registerItem = useCallback((itemValue: string) => {
    setOrderedValues((prev) => (prev.includes(itemValue) ? prev : [...prev, itemValue]));
    return () => {
      setOrderedValues((prev) => prev.filter((entry) => entry !== itemValue));
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      value: current,
      setValue: setCurrent,
      disabled,
      orientation,
      size,
      registerItem,
      orderedValues,
    }),
    [current, disabled, orientation, orderedValues, registerItem, setCurrent, size],
  );

  return (
    <ToggleGroupContext.Provider value={contextValue}>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-orientation={orientation}
        aria-disabled={disabled || undefined}
        className={cn(styles.group, orientation === "vertical" && styles.vertical, className)}
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  );
}

export type ToggleGroupItemProps = {
  value: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
};

const sizeClass: Record<ToggleGroupSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

export function ToggleGroupItem({
  value,
  disabled = false,
  children,
  className,
}: ToggleGroupItemProps) {
  const { value: selectedValue, setValue, disabled: groupDisabled, orientation, size, registerItem, orderedValues } =
    useToggleGroupContext("ToggleGroupItem");
  const isDisabled = groupDisabled || disabled;
  const checked = selectedValue === value;

  useEffect(() => registerItem(value), [registerItem, value]);

  const firstTabStopValue = orderedValues[0];
  const isTabStop =
    !isDisabled && (checked || (selectedValue === "" && value === firstTabStopValue));

  function select() {
    if (isDisabled) return;
    setValue(value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (isDisabled) return;
    handleToggleGroupKeyDown(event, orientation, (next) => {
      setValue(next);
    });
  }

  return (
    <button
      type="button"
      role="radio"
      data-value={value}
      aria-checked={checked}
      disabled={isDisabled}
      tabIndex={isTabStop ? 0 : -1}
      className={cn(styles.item, sizeClass[size], className)}
      onClick={select}
      onKeyDown={handleKeyDown}
    >
      {children}
    </button>
  );
}
