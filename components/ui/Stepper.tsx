"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/stepper.module.css";

export type StepStatus = "completed" | "current" | "upcoming";

export type StepperProps = {
  /**
   * Zero-based index of the current step, matching child order and the
   * index passed to `onStepClick`. Stepper only reads this — it never
   * mutates it; the app owns advancing/rewinding the sequence.
   */
  currentStep: number;
  /**
   * Fires with a step's index when a Completed or Current step is
   * activated. Upcoming steps never call this — Stepper never lets users
   * skip ahead. Omit to render a fully read-only progress indicator.
   * Stepper does not navigate, mutate `currentStep`, or own routing; the
   * app decides what happens on activation.
   */
  onStepClick?: (index: number) => void;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
  children: ReactNode;
};

/** Injected by Stepper onto each Step child — not part of Step's public API. */
type StepInjectedProps = {
  index: number;
  status: StepStatus;
  interactive: boolean;
  onActivate?: (index: number) => void;
  isLast: boolean;
};

/**
 * Fixed, known-length, horizontal sequence of named steps with
 * Completed/Current/Upcoming state, derived structurally from child order
 * and `currentStep` — never a manually-assigned per-step state prop.
 *
 * Built against the verified live Figma source "Navigation/Step Item"
 * (node 2024:2944, 3 variants) and its composed "Stepper Trail (example)"
 * reference frame (node 2024:2949) — see lib/stepper-figma-metadata.ts.
 * There is no separate Figma "Stepper" component; only Step Item is real.
 *
 * Not Progress Bar (quantitative percentage), not Tabs (peer content
 * views), not Breadcrumb (hierarchy), not Pagination (page navigation),
 * not Timeline (open-ended chronological history).
 */
export function Stepper({
  currentStep,
  onStepClick,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
  children,
}: StepperProps) {
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<StepProps>[];
  const total = items.length;

  return (
    <ol
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={cn(styles.stepper, className)}
    >
      {items.map((child, index) => {
        const status: StepStatus =
          index < currentStep ? "completed" : index === currentStep ? "current" : "upcoming";
        const interactive = Boolean(onStepClick) && status !== "upcoming";
        const injected: StepInjectedProps = {
          index,
          status,
          interactive,
          onActivate: onStepClick,
          isLast: index === total - 1,
        };
        return cloneElement(child, { key: child.key ?? index, ...injected });
      })}
    </ol>
  );
}

export type StepProps = {
  /** The step's label. Skrewww renders only this — no description/subtitle/metadata/badge/icon slot in v1. */
  children: ReactNode;
  className?: string;
};

const statusClass: Record<StepStatus, string> = {
  completed: styles.circleCompleted,
  current: styles.circleCurrent,
  upcoming: styles.circleUpcoming,
};

const labelStatusClass: Record<StepStatus, string> = {
  completed: styles.labelCompleted,
  current: styles.labelCurrent,
  upcoming: styles.labelUpcoming,
};

/**
 * A single step within a Stepper. `status`/`index` are supplied by Stepper
 * at render time — Step never accepts them as public props, matching the
 * verified Figma contract (no `state` property surfaced on the item
 * itself; state is structural).
 */
export function Step({
  children,
  className,
  index,
  status,
  interactive,
  onActivate,
  isLast,
}: StepProps & Partial<StepInjectedProps>) {
  if (status === undefined || index === undefined) {
    throw new Error("Step must be used within Stepper");
  }
  const stepIndex = index;

  const indicator = (
    <span className={cn(styles.circle, statusClass[status])} aria-hidden="true">
      {status === "completed" ? (
        <Check weight="bold" className={styles.checkIcon} />
      ) : (
        <span className={styles.number}>{index + 1}</span>
      )}
    </span>
  );

  const label = <span className={cn(styles.label, labelStatusClass[status])}>{children}</span>;

  function handleClick() {
    if (!interactive) return;
    onActivate?.(stepIndex);
  }

  return (
    <li className={cn(styles.item, className)}>
      {interactive ? (
        <button
          type="button"
          className={styles.control}
          aria-current={status === "current" ? "step" : undefined}
          onClick={handleClick}
        >
          {indicator}
          {label}
        </button>
      ) : (
        <span className={styles.control} aria-current={status === "current" ? "step" : undefined}>
          {indicator}
          {label}
        </span>
      )}
      {!isLast ? <span className={styles.connector} aria-hidden="true" /> : null}
    </li>
  );
}
