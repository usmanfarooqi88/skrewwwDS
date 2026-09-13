"use client";

import {
  useCallback,
  useId,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/lib/cn";
import { useControllableState } from "@/lib/use-controllable";
import styles from "@/components/ui/slider.module.css";

export type SliderProps = {
  label: string;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-describedby"?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function countDecimals(step: number) {
  if (!Number.isFinite(step) || step <= 0) return 0;
  const text = String(step);
  const i = text.indexOf(".");
  return i === -1 ? 0 : text.length - i - 1;
}

function snapToStep(raw: number, min: number, max: number, step: number) {
  if (!Number.isFinite(step) || step <= 0) {
    return clamp(raw, min, max);
  }
  const decimals = countDecimals(step);
  const steps = Math.round((raw - min) / step);
  const snapped = min + steps * step;
  const rounded =
    decimals > 0 ? Number(snapped.toFixed(decimals)) : Math.round(snapped);
  return clamp(rounded, min, max);
}

export function Slider({
  label,
  value,
  defaultValue = 0,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  id: idProp,
  className,
  "aria-describedby": ariaDescribedBy,
}: SliderProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const labelId = `${id}-label`;
  const controlRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) && max > safeMin ? max : safeMin + 100;
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  const range = safeMax - safeMin;

  const [current, setCurrent] = useControllableState({
    value,
    defaultValue: snapToStep(defaultValue, safeMin, safeMax, safeStep),
    onChange: onValueChange,
  });

  const numeric = typeof current === "number" && Number.isFinite(current) ? current : safeMin;
  const valueNow = snapToStep(numeric, safeMin, safeMax, safeStep);
  const percent = range === 0 ? 0 : ((valueNow - safeMin) / range) * 100;

  const commitFromClientX = useCallback(
    (clientX: number) => {
      const el = controlRef.current;
      if (!el || disabled) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const next = snapToStep(safeMin + ratio * range, safeMin, safeMax, safeStep);
      setCurrent(next);
    },
    [disabled, range, safeMax, safeMin, safeStep, setCurrent],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;

    const pageStep = Math.max(safeStep, (range / 10) || safeStep);
    let next: number | null = null;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = snapToStep(valueNow + safeStep, safeMin, safeMax, safeStep);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        next = snapToStep(valueNow - safeStep, safeMin, safeMax, safeStep);
        break;
      case "Home":
        next = safeMin;
        break;
      case "End":
        next = safeMax;
        break;
      case "PageUp":
        next = snapToStep(valueNow + pageStep, safeMin, safeMax, safeStep);
        break;
      case "PageDown":
        next = snapToStep(valueNow - pageStep, safeMin, safeMax, safeStep);
        break;
      default:
        return;
    }

    event.preventDefault();
    setCurrent(next);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled) return;
    // Ignore non-primary mouse buttons; allow touch/pen (button may be 0).
    if (event.pointerType === "mouse" && event.button !== 0) return;
    draggingRef.current = true;
    if (typeof event.currentTarget.setPointerCapture === "function") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    commitFromClientX(event.clientX);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || disabled) return;
    commitFromClientX(event.clientX);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (
      typeof event.currentTarget.hasPointerCapture === "function" &&
      event.currentTarget.hasPointerCapture(event.pointerId) &&
      typeof event.currentTarget.releasePointerCapture === "function"
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div className={cn(styles.root, disabled && styles.rootDisabled, className)}>
      <span id={labelId} className={cn(styles.label, disabled && styles.labelDisabled)}>
        {label}
      </span>
      <div
        ref={controlRef}
        id={id}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-valuemin={safeMin}
        aria-valuemax={safeMax}
        aria-valuenow={valueNow}
        aria-labelledby={labelId}
        aria-describedby={ariaDescribedBy}
        aria-disabled={disabled || undefined}
        data-disabled={disabled ? "" : undefined}
        className={styles.control}
        style={
          {
            "--slider-control-height": "1.5rem",
            "--slider-track-height": "0.25rem",
            "--slider-thumb-size": "1rem",
            "--slider-thumb-stroke": "2px",
            "--slider-fill-percent": `${percent}%`,
            "--slider-thumb-left": `${percent}%`,
          } as CSSProperties
        }
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <span className={styles.track} aria-hidden="true" />
        <span className={styles.fill} aria-hidden="true" />
        <span className={styles.thumb} aria-hidden="true" />
      </div>
    </div>
  );
}
