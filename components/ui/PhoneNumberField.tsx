"use client";

import { useId, type ChangeEvent, type ClipboardEvent } from "react";
import { cn } from "@/lib/cn";
import { useControllableState } from "@/lib/use-controllable";
import { ValidationMessage } from "@/components/ui/ValidationMessage";
import { SelectControl, type SelectOption } from "@/components/ui/Select";
import { TextInputControl } from "@/components/ui/TextInputControl";
import {
  DEFAULT_PHONE_COUNTRIES,
  formatCountryOptionLabel,
  sanitizePhoneNumberInput,
  type PhoneCountryOption,
} from "@/lib/phone-number-field-countries";
import styles from "@/components/ui/phone-number-field.module.css";

export type { PhoneCountryOption };

export type PhoneNumberFieldProps = {
  /** Visible fieldset legend for the compound control. */
  label: string;
  /** Accessible name for the country selector. Default: "Country". */
  countryLabel?: string;
  /** Accessible name for the phone number input. Default: "Phone number". */
  numberLabel?: string;
  /** Country options. Defaults to a small illustrative list — override for production. */
  countries?: readonly PhoneCountryOption[];
  country?: string;
  defaultCountry?: string;
  onCountryChange?: (country: string) => void;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  supportingText?: string;
  error?: string;
  hideLabel?: boolean;
  name?: string;
  id?: string;
  className?: string;
};

function FlagPlaceholder() {
  return (
    <span className={styles.flag} aria-hidden="true">
      <span className={styles.flagStripeTop} />
      <span className={styles.flagStripeBottom} />
    </span>
  );
}

/**
 * Compound country dial-code selector + phone number input.
 *
 * UI pattern only — not SMS verification, carrier lookup, or reachability checks.
 */
export function PhoneNumberField({
  label,
  countryLabel = "Country",
  numberLabel = "Phone number",
  countries = DEFAULT_PHONE_COUNTRIES,
  country,
  defaultCountry,
  onCountryChange,
  value,
  defaultValue = "",
  onValueChange,
  placeholder = "Phone number",
  disabled = false,
  readOnly = false,
  required = false,
  supportingText,
  error,
  hideLabel = false,
  name: nameProp,
  id: idProp,
  className,
}: PhoneNumberFieldProps) {
  const generatedId = useId();
  const baseId = idProp ?? generatedId;
  const nameBase = nameProp ?? baseId.replace(/:/g, "");
  const supportingId = supportingText ? `${baseId}-supporting` : undefined;
  const errorId = error ? `${baseId}-error` : undefined;
  const describedBy = [errorId, !error ? supportingId : undefined].filter(Boolean).join(" ");
  const invalid = Boolean(error);

  const countryList = countries.length > 0 ? countries : DEFAULT_PHONE_COUNTRIES;
  const fallbackCountry = countryList[0]?.value ?? "US";

  const countryProvided = country !== undefined;
  const [currentCountry, setCurrentCountry] = useControllableState<string>({
    value: countryProvided ? country : undefined,
    defaultValue: defaultCountry ?? fallbackCountry,
    onChange: onCountryChange,
    valueProvided: countryProvided,
  });

  const valueProvided = value !== undefined;
  const [currentNumber, setCurrentNumber] = useControllableState<string>({
    value: valueProvided ? sanitizePhoneNumberInput(value as string) : undefined,
    defaultValue: sanitizePhoneNumberInput(defaultValue),
    onChange: onValueChange,
    valueProvided,
  });

  const selectOptions: SelectOption[] = countryList.map((option) => ({
    value: option.value,
    label: formatCountryOptionLabel(option),
  }));

  const countryDisabled = disabled || readOnly;

  function handleCountryChange(event: ChangeEvent<HTMLSelectElement>) {
    setCurrentCountry(event.target.value);
  }

  function handleNumberChange(event: ChangeEvent<HTMLInputElement>) {
    setCurrentNumber(sanitizePhoneNumberInput(event.target.value));
  }

  function handleNumberPaste(event: ClipboardEvent<HTMLInputElement>) {
    if (readOnly || disabled) return;
    event.preventDefault();
    const input = event.currentTarget;
    const pasted = sanitizePhoneNumberInput(event.clipboardData.getData("text"));
    const start = input.selectionStart ?? currentNumber.length;
    const end = input.selectionEnd ?? currentNumber.length;
    const next = sanitizePhoneNumberInput(
      `${currentNumber.slice(0, start)}${pasted}${currentNumber.slice(end)}`,
    );
    setCurrentNumber(next);
  }

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

      <div className={styles.row}>
        <div className={styles.country}>
          <label htmlFor={`${baseId}-country`} className={styles.srOnly}>
            {countryLabel}
          </label>
          <FlagPlaceholder />
          <SelectControl
            id={`${baseId}-country`}
            name={`${nameBase}-country`}
            listboxLabel={countryLabel}
            options={selectOptions}
            value={currentCountry}
            valueProvided
            onChange={handleCountryChange}
            disabled={countryDisabled}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy || undefined}
          />
        </div>

        <TextInputControl
          id={`${baseId}-number`}
          name={`${nameBase}-number`}
          className={styles.number}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          spellCheck={false}
          aria-label={numberLabel}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy || undefined}
          placeholder={placeholder}
          value={currentNumber}
          onChange={handleNumberChange}
          onPaste={handleNumberPaste}
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
