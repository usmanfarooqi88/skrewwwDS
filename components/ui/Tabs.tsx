"use client";

import {
  createContext,
  useContext,
  useId,
  useMemo,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { useControllableState } from "@/lib/use-controllable";
import { handleTabListKeyDown } from "@/components/ui/internal/tab-keyboard";
import styles from "@/components/ui/tabs.module.css";

type TabsContextValue = {
  value: string;
  setValue: (next: string) => void;
  activationMode: "automatic" | "manual";
  baseId: string;
  orientation: "horizontal" | "vertical";
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(`${component} must be used within Tabs`);
  }
  return context;
}

export type TabsProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  activationMode?: "automatic" | "manual";
  orientation?: "horizontal" | "vertical";
  children: ReactNode;
  className?: string;
};

export function Tabs({
  value,
  defaultValue = "",
  onValueChange,
  activationMode = "automatic",
  orientation = "horizontal",
  children,
  className,
}: TabsProps) {
  const baseId = useId();
  const [currentValue, setCurrentValue] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  });

  const contextValue = useMemo(
    () => ({
      value: currentValue,
      setValue: setCurrentValue,
      activationMode,
      baseId,
      orientation,
    }),
    [activationMode, baseId, currentValue, orientation, setCurrentValue],
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn(styles.root, className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export type TabsListProps = {
  children: ReactNode;
  className?: string;
  "aria-label": string;
};

export function TabsList({ children, className, "aria-label": ariaLabel }: TabsListProps) {
  const { orientation } = useTabsContext("TabsList");

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation={orientation}
      className={cn(styles.list, className)}
    >
      {children}
    </div>
  );
}

export type TabsTriggerProps = {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
};

export function TabsTrigger({ value, children, disabled = false, className }: TabsTriggerProps) {
  const { value: selectedValue, setValue, activationMode, baseId, orientation } =
    useTabsContext("TabsTrigger");
  const selected = selectedValue === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  return (
    <button
      type="button"
      role="tab"
      id={tabId}
      aria-selected={selected}
      aria-controls={panelId}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={cn(styles.trigger, selected && styles.triggerActive, className)}
      onClick={() => {
        if (disabled) return;
        setValue(value);
      }}
      onKeyDown={(event) => {
        handleTabListKeyDown(event, orientation);
        if (disabled || activationMode !== "manual") return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setValue(value);
        }
      }}
      onFocus={() => {
        if (disabled || activationMode !== "automatic") return;
        setValue(value);
      }}
    >
      {children}
    </button>
  );
}

export type TabsPanelProps = {
  value: string;
  children: ReactNode;
  className?: string;
};

export function TabsPanel({ value, children, className }: TabsPanelProps) {
  const { value: selectedValue, baseId } = useTabsContext("TabsPanel");
  const selected = selectedValue === value;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  return (
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
      hidden={!selected}
      tabIndex={0}
      className={cn(styles.panel, className)}
    >
      {selected ? children : null}
    </div>
  );
}
