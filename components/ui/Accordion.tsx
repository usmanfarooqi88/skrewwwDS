"use client";

import {
  CaretDown,
} from "@phosphor-icons/react";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { useControllableState } from "@/lib/use-controllable";
import styles from "@/components/ui/accordion.module.css";

type AccordionType = "single" | "multiple";

type AccordionContextValue = {
  type: AccordionType;
  openValues: string[];
  toggleItem: (value: string) => void;
  collapsible: boolean;
  baseId: string;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext(component: string): AccordionContextValue {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error(`${component} must be used within Accordion`);
  }
  return context;
}

type AccordionItemContextValue = {
  value: string;
  triggerId: string;
  panelId: string;
  isOpen: boolean;
};

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

function useAccordionItemContext(component: string): AccordionItemContextValue {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error(`${component} must be used within AccordionItem`);
  }
  return context;
}

function normalizeValueArray(
  value: string | string[] | undefined,
  type: AccordionType,
): string[] {
  if (value === undefined) return [];
  if (type === "single") {
    return typeof value === "string" && value ? [value] : [];
  }
  return Array.isArray(value) ? value : value ? [value] : [];
}

export type AccordionProps = {
  type?: AccordionType;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
  children: ReactNode;
  className?: string;
};

export function Accordion({
  type = "single",
  value,
  defaultValue,
  onValueChange,
  collapsible = false,
  children,
  className,
}: AccordionProps) {
  const baseId = useId();
  const [openValues, setOpenValues] = useControllableState<string[]>({
    value: value !== undefined ? normalizeValueArray(value, type) : undefined,
    defaultValue: normalizeValueArray(defaultValue, type),
    onChange: (next) => {
      if (type === "single") {
        onValueChange?.(next[0] ?? "");
      } else {
        onValueChange?.(next);
      }
    },
  });

  const toggleItem = useCallback(
    (itemValue: string) => {
      const isOpen = openValues.includes(itemValue);
      if (type === "single") {
        if (isOpen) {
          setOpenValues(collapsible ? [] : openValues);
        } else {
          setOpenValues([itemValue]);
        }
        return;
      }
      if (isOpen) {
        setOpenValues(openValues.filter((entry) => entry !== itemValue));
      } else {
        setOpenValues([...openValues, itemValue]);
      }
    },
    [collapsible, openValues, setOpenValues, type],
  );

  const contextValue = useMemo(
    () => ({
      type,
      openValues,
      toggleItem,
      collapsible,
      baseId,
    }),
    [baseId, collapsible, openValues, toggleItem, type],
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={cn(styles.root, className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export type AccordionItemProps = {
  value: string;
  children: ReactNode;
  className?: string;
};

export function AccordionItem({ value, children, className }: AccordionItemProps) {
  const { openValues, baseId } = useAccordionContext("AccordionItem");
  const triggerId = `${baseId}-trigger-${value}`;
  const panelId = `${baseId}-panel-${value}`;
  const isOpen = openValues.includes(value);

  const itemContext = useMemo(
    () => ({
      value,
      triggerId,
      panelId,
      isOpen,
    }),
    [isOpen, panelId, triggerId, value],
  );

  return (
    <AccordionItemContext.Provider value={itemContext}>
      <div className={cn(styles.item, className)} data-state={isOpen ? "open" : "closed"}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export type AccordionTriggerProps = {
  children: ReactNode;
  className?: string;
};

export function AccordionTrigger({ children, className }: AccordionTriggerProps) {
  const { toggleItem } = useAccordionContext("AccordionTrigger");
  const { value, triggerId, panelId, isOpen } = useAccordionItemContext("AccordionTrigger");

  return (
    <h3 className={styles.heading}>
      <button
        type="button"
        id={triggerId}
        className={cn(styles.trigger, className)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => toggleItem(value)}
      >
        <span className={styles.triggerLabel}>{children}</span>
        <CaretDown
          size={16}
          aria-hidden="true"
          className={cn(styles.icon, isOpen && styles.iconOpen)}
        />
      </button>
    </h3>
  );
}

export type AccordionPanelProps = {
  children?: ReactNode;
  className?: string;
};

export function AccordionPanel({ children, className }: AccordionPanelProps) {
  const { triggerId, panelId, isOpen } = useAccordionItemContext("AccordionPanel");
  const hasContent = children != null;

  return (
    <div
      id={panelId}
      role="region"
      aria-labelledby={triggerId}
      hidden={!isOpen}
      className={cn(styles.panel, className)}
    >
      {hasContent ? <div className={styles.panelInner}>{children}</div> : null}
    </div>
  );
}
