"use client";

import { CalendarBlank } from "@phosphor-icons/react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from "react";
import { CalendarGrid } from "@/components/ui/CalendarGrid";
import { FormField } from "@/components/ui/FormField";
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { TextInputControl } from "@/components/ui/TextInputControl";
import { cn } from "@/lib/cn";
import {
  CALENDAR_DEFAULT_LOCALE,
  CALENDAR_DEFAULT_WEEK_STARTS_ON,
  formatDisplayDate,
  getMonthFromDate,
  getTodayCalendarDate,
  isDateWithinRange,
  parseCalendarDate,
  parseDisplayDate,
  warnIfFormatterPairIncomplete,
  type CalendarDateString,
  type CalendarFormatterOverrides,
  type CalendarMonthParts,
} from "@/components/ui/internal/calendar-date";
import { useControllableState } from "@/lib/use-controllable";
import styles from "@/components/ui/date-picker.module.css";

const OUT_OF_RANGE_MESSAGE = "Choose a date within the allowed range.";
const DISABLED_DATE_MESSAGE = "This date is not available.";
const REQUIRED_MESSAGE = "This field is required.";

export type DatePickerProps = {
  label: string;
  value?: CalendarDateString;
  defaultValue?: CalendarDateString;
  onValueChange?: (value: CalendarDateString | undefined) => void;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  supportingText?: string;
  hideLabel?: boolean;
  placeholder?: string;
  className?: string;
  minDate?: CalendarDateString;
  maxDate?: CalendarDateString;
  isDateDisabled?: (date: CalendarDateString) => boolean;
  locale?: string;
  weekStartsOn?: 0 | 1;
} & CalendarFormatterOverrides;

function formatInputValue(
  date: CalendarDateString | undefined,
  locale: string,
  formatDate?: (date: CalendarDateString) => string,
): string {
  if (!date) return "";
  return formatDate?.(date) ?? formatDisplayDate(date, locale);
}

function invalidFormatMessage(
  locale: string,
  formatDate?: (date: CalendarDateString) => string,
): string {
  if (formatDate) {
    return `Enter a date like ${formatDate("2026-07-11")}.`;
  }
  return `Enter a date like ${formatDisplayDate("2026-07-11", locale)}.`;
}

function resolveInitialVisibleMonth(
  date: CalendarDateString | undefined,
): CalendarMonthParts {
  if (date && parseCalendarDate(date)) {
    return getMonthFromDate(date);
  }
  return getMonthFromDate(getTodayCalendarDate());
}

export function DatePicker(props: DatePickerProps) {
  const valueProvided = "value" in props;
  const {
    label,
    value,
    defaultValue,
    onValueChange,
    name,
    id,
    required = false,
    disabled = false,
    readOnly = false,
    error,
    supportingText,
    hideLabel = false,
    placeholder = "Select a date",
    className,
    minDate,
    maxDate,
    isDateDisabled,
    locale = CALENDAR_DEFAULT_LOCALE,
    weekStartsOn = CALENDAR_DEFAULT_WEEK_STARTS_ON,
    formatMonth,
    formatWeekday,
    formatDate,
    parseDate,
  } = props;
  useEffect(() => {
    warnIfFormatterPairIncomplete({ formatMonth, formatWeekday, formatDate, parseDate });
  }, [formatDate, formatMonth, formatWeekday, parseDate]);

  const generatedId = useId();
  const controlId = id ?? generatedId;
  const calendarButtonId = `${controlId}-calendar-button`;
  const initialFocusRef = useRef<HTMLButtonElement | null>(null);
  const calendarButtonRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  const calendarPopoverId = `${controlId}-calendar-popover`;

  const [selectedDate, setSelectedDate] = useControllableState<CalendarDateString | undefined>({
    value,
    defaultValue,
    onChange: onValueChange,
    valueProvided,
  });

  const [inputText, setInputText] = useState(() =>
    formatInputValue(defaultValue ?? value, locale, formatDate),
  );
  const [internalError, setInternalError] = useState<string | undefined>();
  const [visibleMonth, setVisibleMonth] = useState<CalendarMonthParts>(() =>
    resolveInitialVisibleMonth(defaultValue ?? value),
  );

  useEffect(() => {
    if (!valueProvided) return;
    setInputText(formatInputValue(value, locale, formatDate));
    setInternalError(undefined);
    if (value) {
      setVisibleMonth(getMonthFromDate(value));
    }
  }, [formatDate, locale, value, valueProvided]);

  const wasOpenRef = useRef(open);
  useEffect(() => {
    // Popover's own close-time focus restore targets the PopoverTrigger
    // wrapper (the plain <div> below) via requestClose's `restoreFocus`
    // option, but that div isn't focusable — the actual interactive trigger
    // is the calendar icon button nested inside it. Restore focus there
    // explicitly whenever the popover transitions from open to closed
    // (Escape, outside click, or a completed selection all go through this).
    if (wasOpenRef.current && !open) {
      calendarButtonRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  const parseInputText = useCallback(
    (text: string) => parseDate?.(text) ?? parseDisplayDate(text, locale),
    [locale, parseDate],
  );

  const formatSelectedDate = useCallback(
    (date: CalendarDateString) => formatDate?.(date) ?? formatDisplayDate(date, locale),
    [formatDate, locale],
  );

  const fieldError = error ?? internalError;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if ((disabled || readOnly) && next) return;
      setOpen(next);
    },
    [disabled, readOnly],
  );

  const commitInputText = useCallback(
    (text: string) => {
      const trimmed = text.trim();

      if (!trimmed) {
        if (required) {
          setInternalError(REQUIRED_MESSAGE);
          return;
        }
        setInternalError(undefined);
        setSelectedDate(undefined);
        return;
      }

      const parsed = parseInputText(trimmed);
      if (!parsed) {
        setInternalError(invalidFormatMessage(locale, formatDate));
        return;
      }

      if (!isDateWithinRange(parsed, minDate, maxDate)) {
        setInternalError(OUT_OF_RANGE_MESSAGE);
        return;
      }

      if (isDateDisabled?.(parsed)) {
        setInternalError(DISABLED_DATE_MESSAGE);
        return;
      }

      setInternalError(undefined);
      setSelectedDate(parsed);
      setVisibleMonth(getMonthFromDate(parsed));
      setInputText(formatSelectedDate(parsed));
    },
    [
      formatDate,
      formatSelectedDate,
      isDateDisabled,
      locale,
      maxDate,
      minDate,
      parseInputText,
      required,
      setSelectedDate,
    ],
  );

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
    if (internalError) {
      setInternalError(undefined);
    }
  }, [internalError]);

  const handleInputBlur = useCallback(() => {
    if (disabled || readOnly) return;
    commitInputText(inputText);
  }, [commitInputText, disabled, inputText, readOnly]);

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      event.stopPropagation();
      if (event.key === "Enter") {
        event.preventDefault();
        commitInputText(inputText);
      }
    },
    [commitInputText, inputText],
  );

  const handleGridSelect = useCallback(
    (date: CalendarDateString) => {
      setSelectedDate(date);
      setInputText(formatSelectedDate(date));
      setInternalError(undefined);
      setVisibleMonth(getMonthFromDate(date));
      setOpen(false);
    },
    [formatSelectedDate, setSelectedDate],
  );

  const handleCalendarButtonClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      handleOpenChange(!open);
    },
    [handleOpenChange, open],
  );

  const handleTriggerPointerDown = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("input") || target.closest("button")) {
      event.preventDefault();
    }
  }, []);

  const initialFocusDate =
    selectedDate && parseCalendarDate(selectedDate)
      ? selectedDate
      : getTodayCalendarDate();

  return (
    <FormField
      label={label}
      controlId={controlId}
      required={required}
      hideLabel={hideLabel}
      supportingText={supportingText}
      error={fieldError}
    >
      {({ controlId: fieldId, describedBy, invalid }) => (
        <Popover open={open} onOpenChange={handleOpenChange} focusMode="content" contentId={calendarPopoverId}>
          <PopoverTrigger>
            <div
              className={cn(styles.root, className)}
              onClick={handleTriggerPointerDown}
            >
              <TextInputControl
                id={fieldId}
                readOnly={readOnly}
                disabled={disabled}
                required={required}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                aria-haspopup="grid"
                placeholder={placeholder}
                value={readOnly ? formatInputValue(selectedDate, locale, formatDate) : inputText}
                onChange={readOnly ? undefined : handleInputChange}
                onBlur={readOnly ? undefined : handleInputBlur}
                onKeyDown={readOnly ? undefined : handleInputKeyDown}
                trailingAction={
                  <button
                    ref={calendarButtonRef}
                    id={calendarButtonId}
                    type="button"
                    className={styles.calendarButton}
                    aria-label="Open calendar"
                    aria-expanded={open}
                    aria-controls={open ? calendarPopoverId : undefined}
                    disabled={disabled || readOnly}
                    onClick={handleCalendarButtonClick}
                  >
                    <CalendarBlank size={18} aria-hidden="true" />
                  </button>
                }
              />
              {name ? (
                <input type="hidden" name={name} value={selectedDate ?? ""} disabled={disabled} />
              ) : null}
            </div>
          </PopoverTrigger>
          {/*
            matchTriggerWidth is intentionally off: the calendar grid has a fixed
            natural width (--calendar-grid-width) wider than most single-line inputs.
            Pinning to the trigger would squeeze the 7-column grid and clip day cells.
          */}
          <PopoverContent
            id={calendarPopoverId}
            initialFocusRef={initialFocusRef as RefObject<HTMLElement | null>}
            className={styles.popover}
          >
            <PopoverBody>
              <CalendarGrid
                aria-label="Choose date"
                value={selectedDate}
                onValueChange={handleGridSelect}
                visibleMonth={visibleMonth}
                onVisibleMonthChange={setVisibleMonth}
                initialFocusDate={initialFocusDate}
                minDate={minDate}
                maxDate={maxDate}
                isDateDisabled={isDateDisabled}
                locale={locale}
                weekStartsOn={weekStartsOn}
                formatMonth={formatMonth}
                formatWeekday={formatWeekday}
                dayButtonRef={initialFocusRef}
              />
            </PopoverBody>
          </PopoverContent>
        </Popover>
      )}
    </FormField>
  );
}
