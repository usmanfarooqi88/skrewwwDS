"use client";

import { MagnifyingGlass, XCircle } from "@phosphor-icons/react";
import {
  forwardRef,
  useId,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/cn";
import { FormField } from "@/components/ui/FormField";
import {
  TextInputControl,
  type TextInputControlProps,
} from "@/components/ui/TextInputControl";
import { useControllableState } from "@/lib/use-controllable";
import styles from "@/components/ui/search-field.module.css";

export type SearchFieldSize = TextInputControlProps["size"];

const iconSizeByControlSize = {
  sm: 16,
  md: 20,
  lg: 20,
} as const;

export type SearchFieldProps = Omit<TextInputControlProps, "type" | "value" | "defaultValue"> & {
  label: string;
  supportingText?: string;
  error?: string;
  hideLabel?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Shows a clear button once the field has a value. Matches Figma "Show clear icon". */
  showClear?: boolean;
};

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  props,
  ref,
) {
  const valueProvided = "value" in props;
  const {
    label,
    supportingText,
    error,
    hideLabel = false,
    id: idProp,
    required,
    size = "md",
    value,
    defaultValue = "",
    onValueChange,
    onChange,
    onKeyDown: onKeyDownProp,
    showClear = true,
    className,
    disabled,
    readOnly,
    ...rest
  } = props;
  const generatedId = useId();
  const clearButtonId = `${idProp ?? generatedId}-clear`;

  const [query, setQuery] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
    valueProvided,
  });

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
    onChange?.(event);
  }

  function clearSearch() {
    if (disabled || readOnly) return;
    setQuery("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && showClear && query) {
      event.preventDefault();
      clearSearch();
    }
    onKeyDownProp?.(event);
  }

  const canClear = showClear && Boolean(query) && !disabled && !readOnly;

  return (
    <FormField
      label={label}
      controlId={idProp}
      required={required}
      hideLabel={hideLabel}
      supportingText={supportingText}
      error={error}
    >
      {({ controlId, describedBy, invalid }) => (
        <TextInputControl
          ref={ref}
          id={controlId}
          type="search"
          size={size}
          value={query}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          leadingIcon={
            <MagnifyingGlass
              className={styles.leadingIcon}
              size={iconSizeByControlSize[size]}
              weight="regular"
            />
          }
          trailingAction={
            canClear ? (
              <button
                type="button"
                id={clearButtonId}
                className={styles.clearButton}
                aria-label="Clear search"
                onClick={clearSearch}
              >
                <XCircle
                  size={iconSizeByControlSize[size]}
                  weight="regular"
                  aria-hidden="true"
                />
              </button>
            ) : undefined
          }
          className={cn(className)}
          {...rest}
        />
      )}
    </FormField>
  );
});
