/**
 * Small illustrative country/dial-code list for Phone Number Field.
 * Not a complete ISO dataset — consumers should pass `countries` for production.
 */
export type PhoneCountryOption = {
  /** Stable option id (e.g. ISO 3166-1 alpha-2). */
  value: string;
  /** Dialing prefix including leading +, e.g. "+1". */
  dialCode: string;
  /** Human-readable country/region name. */
  label: string;
};

export const DEFAULT_PHONE_COUNTRIES: readonly PhoneCountryOption[] = [
  { value: "US", dialCode: "+1", label: "United States" },
  { value: "CA", dialCode: "+1", label: "Canada" },
  { value: "GB", dialCode: "+44", label: "United Kingdom" },
  { value: "AU", dialCode: "+61", label: "Australia" },
  { value: "DE", dialCode: "+49", label: "Germany" },
  { value: "FR", dialCode: "+33", label: "France" },
  { value: "IN", dialCode: "+91", label: "India" },
  { value: "PK", dialCode: "+92", label: "Pakistan" },
  { value: "AE", dialCode: "+971", label: "United Arab Emirates" },
  { value: "BR", dialCode: "+55", label: "Brazil" },
  { value: "JP", dialCode: "+81", label: "Japan" },
  { value: "MX", dialCode: "+52", label: "Mexico" },
] as const;

/** Allow digits and common phone punctuation; strip other characters. */
export function sanitizePhoneNumberInput(value: string): string {
  return value.replace(/[^\d+\s().-]/g, "");
}

export function formatCountryOptionLabel(option: PhoneCountryOption): string {
  return `${option.label} (${option.dialCode})`;
}
