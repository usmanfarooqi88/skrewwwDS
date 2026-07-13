"use client";

import { forwardRef, useId } from "react";
import { FormField } from "@/components/ui/FormField";
import {
  TextInputControl,
  type TextInputControlProps,
} from "@/components/ui/TextInputControl";

export type TextInputSize = TextInputControlProps["size"];

export type TextInputProps = TextInputControlProps & {
  label: string;
  supportingText?: string;
  error?: string;
  hideLabel?: boolean;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  {
    label,
    supportingText,
    error,
    hideLabel = false,
    id: idProp,
    required,
    ...controlProps
  },
  ref,
) {
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
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          {...controlProps}
        />
      )}
    </FormField>
  );
});
