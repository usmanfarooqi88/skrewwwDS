"use client";

import { CaretDown, CaretUp } from "@phosphor-icons/react";
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { useControllableState } from "@/lib/use-controllable";
import { FormField } from "@/components/ui/FormField";
import {
  TextInputControl,
  type TextInputControlProps,
} from "@/components/ui/TextInputControl";
import {
  commitNumberDraft,
  formatCommittedNumber,
  isAllowedNumberDraft,
  parseNumberDraft,
  stepNumber,
} from "@/lib/number-input-value";
import styles from "@/components/ui/number-input.module.css";

export type NumberInputSize = TextInputControlProps["size"];

export type NumberInputProps = {
  label: string;
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  supportingText?: string;
  error?: string;
  placeholder?: string;
  hideLabel?: boolean;
  /** When true (default), shows increment/decrement controls. */
  showSteppers?: boolean;
  name?: string;
  id?: string;
  size?: NumberInputSize;
  className?: string;
};

/**
 * Direct numeric entry with optional steppers.
 *
 * Uses text semantics + spinbutton ARIA (not native type=number) so intermediate
 * drafts ("-", "1.") remain editable and browser spinner chrome stays consistent.
 * Not a currency field, quantity business logic, or Slider substitute.
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  {
    label,
    value,
    defaultValue = null,
    onValueChange,
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY,
    step = 1,
    disabled = false,
    readOnly = false,
    required = false,
    supportingText,
    error,
    placeholder,
    hideLabel = false,
    showSteppers = true,
    name,
    id: idProp,
    size = "md",
    className,
  },
  ref,
) {
  const valueProvided = value !== undefined;
  const generatedId = useId();
  const controlId = idProp ?? generatedId;

  const safeMin = Number.isFinite(min) ? min : Number.NEGATIVE_INFINITY;
  const safeMax = Number.isFinite(max) ? max : Number.POSITIVE_INFINITY;
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;

  const [committed, setCommitted] = useControllableState<number | null>({
    value: valueProvided ? value : undefined,
    defaultValue,
    onChange: onValueChange,
    valueProvided,
  });

  const [draft, setDraft] = useState(() => formatCommittedNumber(committed));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (focusedRef.current) return;
    setDraft(formatCommittedNumber(committed));
  }, [committed]);

  function commitText(text: string) {
    const next = commitNumberDraft(text, safeMin, safeMax, safeStep, committed);
    setCommitted(next);
    setDraft(formatCommittedNumber(next));
  }

  function applyStep(direction: 1 | -1) {
    if (disabled || readOnly) return;
    const next = stepNumber(committed, direction, safeMin, safeMax, safeStep);
    setCommitted(next);
    setDraft(formatCommittedNumber(next));
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    if (!isAllowedNumberDraft(next)) return;
    setDraft(next);
    const parsed = parseNumberDraft(next);
    if (parsed.kind === "empty") {
      setCommitted(null);
      return;
    }
    if (parsed.kind === "valid") {
      // Live update without clamping so typing past max remains editable until blur.
      setCommitted(parsed.value);
    }
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    focusedRef.current = false;
    commitText(event.currentTarget.value);
  }

  function handleFocus() {
    focusedRef.current = true;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (disabled || readOnly) return;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      applyStep(1);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      applyStep(-1);
      return;
    }
    if (event.key === "Enter") {
      commitText(draft);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    if (disabled || readOnly) return;
    const pasted = event.clipboardData.getData("text").trim();
    const cleaned = pasted.replace(/[^\d.\-]/g, "");
    if (!isAllowedNumberDraft(cleaned)) {
      event.preventDefault();
      return;
    }
    if (cleaned !== pasted) {
      event.preventDefault();
      setDraft(cleaned);
      const parsed = parseNumberDraft(cleaned);
      if (parsed.kind === "empty") setCommitted(null);
      else if (parsed.kind === "valid") setCommitted(parsed.value);
    }
  }

  const canDecrement =
    !disabled &&
    !readOnly &&
    (committed === null || !Number.isFinite(safeMin) || committed > safeMin);
  const canIncrement =
    !disabled &&
    !readOnly &&
    (committed === null || !Number.isFinite(safeMax) || committed < safeMax);

  const inputMode =
    Number.isInteger(safeStep) && (!Number.isFinite(safeMin) || safeMin >= 0)
      ? "numeric"
      : "decimal";

  const ariaValueMin = Number.isFinite(safeMin) ? safeMin : undefined;
  const ariaValueMax = Number.isFinite(safeMax) ? safeMax : undefined;

  return (
    <FormField
      label={label}
      controlId={controlId}
      required={required}
      hideLabel={hideLabel}
      supportingText={supportingText}
      error={error}
      className={className}
    >
      {({ controlId: id, describedBy, invalid }) => (
        <TextInputControl
          ref={ref}
          id={id}
          name={name}
          className={styles.control}
          size={size}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          spellCheck={false}
          role="spinbutton"
          aria-valuemin={ariaValueMin}
          aria-valuemax={ariaValueMax}
          aria-valuenow={committed === null ? undefined : committed}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          placeholder={placeholder}
          value={draft}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          trailingAction={
            showSteppers ? (
              <span className={styles.steppers}>
                <button
                  type="button"
                  className={styles.stepButton}
                  aria-label="Increment"
                  tabIndex={-1}
                  disabled={!canIncrement}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyStep(1)}
                >
                  <CaretUp size={12} weight="bold" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={styles.stepButton}
                  aria-label="Decrement"
                  tabIndex={-1}
                  disabled={!canDecrement}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyStep(-1)}
                >
                  <CaretDown size={12} weight="bold" aria-hidden="true" />
                </button>
              </span>
            ) : undefined
          }
        />
      )}
    </FormField>
  );
});
