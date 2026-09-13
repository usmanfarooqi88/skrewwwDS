"use client";

import { CreditCard } from "@phosphor-icons/react";
import {
  useId,
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
} from "react";
import { cn } from "@/lib/cn";
import { useControllableState } from "@/lib/use-controllable";
import { ValidationMessage } from "@/components/ui/ValidationMessage";
import {
  CREDIT_CARD_CVC_MAX_DIGITS,
  CREDIT_CARD_EXPIRY_MAX_DIGITS,
  CREDIT_CARD_NUMBER_MAX_DIGITS,
  digitsOnly,
  formatCardNumberDisplay,
  formatCvcDisplay,
  formatExpiryDisplay,
  mapCaretAfterFormat,
} from "@/lib/credit-card-field-format";
import styles from "@/components/ui/credit-card-field.module.css";

export type CreditCardFieldValue = {
  /** Digit-only PAN (no spaces). */
  number: string;
  /** Digit-only expiry MMYY (no slash). */
  expiry: string;
  /** Digit-only CVC/CVV. */
  cvc: string;
};

export type CreditCardFieldProps = {
  /** Visible group label (fieldset legend). */
  label: string;
  /** Accessible name for the card-number segment. Default: "Card number". */
  numberLabel?: string;
  /** Accessible name for the expiry segment. Default: "Expiry". */
  expiryLabel?: string;
  /** Accessible name for the CVC segment. Default: "CVC". */
  cvcLabel?: string;
  numberPlaceholder?: string;
  expiryPlaceholder?: string;
  cvcPlaceholder?: string;
  value?: CreditCardFieldValue;
  defaultValue?: CreditCardFieldValue;
  onValueChange?: (value: CreditCardFieldValue) => void;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  supportingText?: string;
  error?: string;
  hideLabel?: boolean;
  /** Prefix for native `name` attributes (`${name}-number`, etc.). */
  name?: string;
  id?: string;
  className?: string;
};

const EMPTY_VALUE: CreditCardFieldValue = { number: "", expiry: "", cvc: "" };

function normalizeValue(value: CreditCardFieldValue): CreditCardFieldValue {
  return {
    number: digitsOnly(value.number, CREDIT_CARD_NUMBER_MAX_DIGITS),
    expiry: digitsOnly(value.expiry, CREDIT_CARD_EXPIRY_MAX_DIGITS),
    cvc: digitsOnly(value.cvc, CREDIT_CARD_CVC_MAX_DIGITS),
  };
}

/**
 * Compound card-details control: number + expiry + CVC in one visual shell.
 *
 * This is a UI pattern only — not a payment processor, tokenizer, or PCI vault.
 * Prefer a payment provider’s hosted fields for production card capture.
 */
export function CreditCardField({
  label,
  numberLabel = "Card number",
  expiryLabel = "Expiry",
  cvcLabel = "CVC",
  numberPlaceholder = "Card number",
  expiryPlaceholder = "MM/YY",
  cvcPlaceholder = "CVC",
  value,
  defaultValue = EMPTY_VALUE,
  onValueChange,
  disabled = false,
  readOnly = false,
  required = false,
  supportingText,
  error,
  hideLabel = false,
  name: nameProp,
  id: idProp,
  className,
}: CreditCardFieldProps) {
  const generatedId = useId();
  const baseId = idProp ?? generatedId;
  const nameBase = nameProp ?? baseId.replace(/:/g, "");
  const supportingId = supportingText ? `${baseId}-supporting` : undefined;
  const errorId = error ? `${baseId}-error` : undefined;
  const describedBy = [errorId, !error ? supportingId : undefined].filter(Boolean).join(" ");
  const invalid = Boolean(error);

  const numberRef = useRef<HTMLInputElement | null>(null);
  const expiryRef = useRef<HTMLInputElement | null>(null);
  const cvcRef = useRef<HTMLInputElement | null>(null);

  const valueProvided = value !== undefined;
  const [current, setCurrent] = useControllableState<CreditCardFieldValue>({
    value: valueProvided ? normalizeValue(value as CreditCardFieldValue) : undefined,
    defaultValue: normalizeValue(defaultValue),
    onChange: onValueChange,
    valueProvided,
  });

  function commit(next: CreditCardFieldValue) {
    setCurrent(normalizeValue(next));
  }

  function handleNumberChange(event: ChangeEvent<HTMLInputElement>) {
    const el = event.target;
    const caret = el.selectionStart ?? el.value.length;
    const prevDisplay = el.value;
    const nextDigits = digitsOnly(el.value, CREDIT_CARD_NUMBER_MAX_DIGITS);
    const nextDisplay = formatCardNumberDisplay(nextDigits);
    commit({ ...current, number: nextDigits });
    requestAnimationFrame(() => {
      const node = numberRef.current;
      if (!node) return;
      const nextCaret = mapCaretAfterFormat(prevDisplay, caret, nextDisplay);
      node.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function handleExpiryChange(event: ChangeEvent<HTMLInputElement>) {
    const el = event.target;
    const caret = el.selectionStart ?? el.value.length;
    const prevDisplay = el.value;
    const nextDigits = digitsOnly(el.value, CREDIT_CARD_EXPIRY_MAX_DIGITS);
    const nextDisplay = formatExpiryDisplay(nextDigits);
    commit({ ...current, expiry: nextDigits });
    requestAnimationFrame(() => {
      const node = expiryRef.current;
      if (!node) return;
      const nextCaret = mapCaretAfterFormat(prevDisplay, caret, nextDisplay);
      node.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function handleCvcChange(event: ChangeEvent<HTMLInputElement>) {
    const nextDigits = digitsOnly(event.target.value, CREDIT_CARD_CVC_MAX_DIGITS);
    commit({ ...current, cvc: nextDigits });
  }

  function handlePaste(
    field: keyof CreditCardFieldValue,
    max: number,
    event: ClipboardEvent<HTMLInputElement>,
  ) {
    event.preventDefault();
    const pasted = digitsOnly(event.clipboardData.getData("text"), max);
    commit({ ...current, [field]: pasted });
  }

  const numberDisplay = formatCardNumberDisplay(current.number);
  const expiryDisplay = formatExpiryDisplay(current.expiry);
  const cvcDisplay = formatCvcDisplay(current.cvc);

  return (
    <fieldset
      className={cn(styles.field, className)}
      disabled={disabled || undefined}
      aria-describedby={describedBy || undefined}
      aria-invalid={invalid || undefined}
      aria-required={required || undefined}
    >
      <legend className={hideLabel ? styles.srOnly : styles.legend}>
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

      <div
        className={cn(
          styles.shell,
          invalid && styles.invalid,
          disabled && styles.disabled,
        )}
      >
        <span className={styles.icon} aria-hidden="true">
          <CreditCard size={20} weight="regular" />
        </span>

        <input
          ref={numberRef}
          id={`${baseId}-number`}
          name={`${nameBase}-number`}
          className={cn(styles.segment, styles.number)}
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          spellCheck={false}
          aria-label={numberLabel}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy || undefined}
          placeholder={numberPlaceholder}
          value={numberDisplay}
          onChange={handleNumberChange}
          onPaste={(event) => handlePaste("number", CREDIT_CARD_NUMBER_MAX_DIGITS, event)}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
        />

        <span className={styles.divider} aria-hidden="true" />

        <input
          ref={expiryRef}
          id={`${baseId}-expiry`}
          name={`${nameBase}-expiry`}
          className={cn(styles.segment, styles.expiry)}
          type="text"
          inputMode="numeric"
          autoComplete="cc-exp"
          spellCheck={false}
          aria-label={expiryLabel}
          aria-invalid={invalid || undefined}
          placeholder={expiryPlaceholder}
          value={expiryDisplay}
          onChange={handleExpiryChange}
          onPaste={(event) => handlePaste("expiry", CREDIT_CARD_EXPIRY_MAX_DIGITS, event)}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
        />

        <span className={styles.divider} aria-hidden="true" />

        <input
          ref={cvcRef}
          id={`${baseId}-cvc`}
          name={`${nameBase}-cvc`}
          className={cn(styles.segment, styles.cvc)}
          type="text"
          inputMode="numeric"
          autoComplete="cc-csc"
          spellCheck={false}
          aria-label={cvcLabel}
          aria-invalid={invalid || undefined}
          placeholder={cvcPlaceholder}
          value={cvcDisplay}
          onChange={handleCvcChange}
          onPaste={(event) => handlePaste("cvc", CREDIT_CARD_CVC_MAX_DIGITS, event)}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
        />
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
