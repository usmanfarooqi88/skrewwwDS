"use client";

import { CaretDown } from "@phosphor-icons/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type Ref,
} from "react";
import { cn } from "@/lib/cn";
import { FormField } from "@/components/ui/FormField";
import {
  Popover,
  PopoverAnchor,
  PopoverBody,
  PopoverContent,
} from "@/components/ui/Popover";
import { useControllableState } from "@/lib/use-controllable";
import {
  filterComboboxOptions,
  findOptionByLabel,
  resolveOptionLabel,
  type ComboboxFilterMode,
} from "@/components/ui/internal/combobox-filter";
import { useComboboxListStatus } from "@/components/ui/internal/combobox-list-status";
import {
  getComboboxOptionId,
  getComboboxOptionValueFromId,
  moveComboboxActiveOptionId,
  resolveInitialActiveOptionId,
} from "@/components/ui/internal/combobox-keyboard";
import { scrollComboboxOptionIntoView } from "@/components/ui/internal/combobox-scroll";
import inputStyles from "@/components/ui/text-input.module.css";
import styles from "@/components/ui/combobox.module.css";

export type ComboboxOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type ComboboxSize = "sm" | "md" | "lg";

export type ComboboxControlProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "value" | "defaultValue" | "onChange"
> & {
  options: ComboboxOption[];
  size?: ComboboxSize;
  placeholder?: string;
  filterMode?: ComboboxFilterMode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  inputValue?: string;
  defaultInputValue?: string;
  onInputValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  listboxLabel?: string;
  valueProvided?: boolean;
  inputValueProvided?: boolean;
  openProvided?: boolean;
};

const sizeClass: Record<ComboboxSize, string> = {
  sm: inputStyles.sizeSm,
  md: inputStyles.sizeMd,
  lg: inputStyles.sizeLg,
};

function ComboboxListbox({
  listboxId,
  listboxLabel,
  listboxRef,
  filteredOptions,
  selectedValue,
  activeOptionId,
  onSelect,
  onOptionPointerEnter,
  onOptionPointerDown,
  onListboxPointerMove,
  noResultsLabel,
}: {
  listboxId: string;
  listboxLabel: string;
  listboxRef: Ref<HTMLUListElement>;
  filteredOptions: ComboboxOption[];
  selectedValue: string;
  activeOptionId: string | null;
  onSelect: (value: string) => void;
  onOptionPointerEnter: (optionId: string, disabled?: boolean) => void;
  onOptionPointerDown: () => void;
  onListboxPointerMove: (event: PointerEvent<HTMLUListElement>) => void;
  noResultsLabel: string;
}) {
  return (
    <PopoverContent matchTriggerWidth className={styles.listboxPopover}>
      <PopoverBody className={styles.listboxBody}>
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label={listboxLabel}
          className={styles.listbox}
          onPointerMove={onListboxPointerMove}
        >
          {filteredOptions.length === 0 ? (
            <li className={styles.noResults} aria-hidden="true">
              {noResultsLabel}
            </li>
          ) : (
            filteredOptions.map((option) => {
              const optionId = getComboboxOptionId(listboxId, option.value);
              return (
                <li key={option.value} role="presentation" className={styles.optionItem}>
                  <div
                    id={optionId}
                    role="option"
                    aria-selected={option.value === selectedValue}
                    aria-disabled={option.disabled || undefined}
                    className={cn(
                      styles.option,
                      option.value === selectedValue && styles.optionSelected,
                      activeOptionId === optionId && styles.optionActive,
                      option.disabled && styles.optionDisabled,
                    )}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onOptionPointerDown();
                    }}
                    onPointerEnter={() => onOptionPointerEnter(optionId, option.disabled)}
                    onClick={() => onSelect(option.value)}
                  >
                    {option.label}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </PopoverBody>
    </PopoverContent>
  );
}

export const ComboboxControl = forwardRef<HTMLInputElement, ComboboxControlProps>(
  function ComboboxControl(
    {
      options,
      size = "md",
      placeholder,
      filterMode = "prefix",
      className,
      disabled,
      required,
      name,
      id,
      value,
      defaultValue = "",
      onValueChange,
      inputValue: inputValueProp,
      defaultInputValue,
      onInputValueChange,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      listboxLabel = "Options",
      valueProvided = false,
      inputValueProvided = false,
      openProvided = false,
      "aria-invalid": ariaInvalid,
      "aria-describedby": ariaDescribedBy,
      ...rest
    },
    ref,
  ) {
    const listboxId = useId();
    const listStatusId = useId();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const listboxRef = useRef<HTMLUListElement | null>(null);
    const pendingSelectionRef = useRef(false);
    const blurTimeoutRef = useRef<number | null>(null);
    const pointerSyncEnabledRef = useRef(false);
    const keyboardNavigationRef = useRef(false);

    const resolvedDefaultInput =
      defaultInputValue ?? resolveOptionLabel(options, defaultValue ?? "");
    const initialSelectedRef = useRef(defaultValue ?? "");
    const initialInputRef = useRef(resolvedDefaultInput);

    const [selectedValue, setSelectedValue] = useControllableState({
      value,
      defaultValue,
      onChange: onValueChange,
      valueProvided,
    });

    const [inputValue, setInputValue] = useControllableState({
      value: inputValueProp,
      defaultValue: resolvedDefaultInput,
      onChange: onInputValueChange,
      valueProvided: inputValueProvided,
    });

    const [open, setOpen] = useControllableState({
      value: openProp,
      defaultValue: defaultOpen,
      onChange: onOpenChange,
      valueProvided: openProvided,
    });

    const [activeOptionId, setActiveOptionId] = useState<string | null>(null);
    const previousSelectedValueRef = useRef<string | undefined>(undefined);

    const filteredOptions = useMemo(
      () => filterComboboxOptions(options, inputValue, filterMode),
      [filterMode, inputValue, options],
    );

    const listStatusAnnouncement = useComboboxListStatus({
      open,
      disabled,
      resultCount: filteredOptions.length,
    });

    const inputDescribedBy = useMemo(() => {
      const ids = [ariaDescribedBy, open ? listStatusId : undefined].filter(Boolean);
      return ids.length ? ids.join(" ") : undefined;
    }, [ariaDescribedBy, listStatusId, open]);

    const formResetFormRef = useRef<HTMLFormElement | null>(null);

    const handleFormReset = useCallback(() => {
      if (blurTimeoutRef.current !== null) {
        window.clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      if (!valueProvided) setSelectedValue(initialSelectedRef.current);
      if (!inputValueProvided) setInputValue(initialInputRef.current);
      if (!openProvided) setOpen(false);
      previousSelectedValueRef.current = initialSelectedRef.current;
    }, [inputValueProvided, openProvided, setInputValue, setOpen, setSelectedValue, valueProvided]);

    const setInputRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;

        if (formResetFormRef.current) {
          formResetFormRef.current.removeEventListener("reset", handleFormReset);
          formResetFormRef.current = null;
        }

        if (node?.form) {
          formResetFormRef.current = node.form;
          node.form.addEventListener("reset", handleFormReset);
        }
      },
      [handleFormReset, ref],
    );

    const closeListbox = useCallback(
      (options?: { restoreFocus?: boolean }) => {
        setOpen(false);
        if (options?.restoreFocus !== false) {
          inputRef.current?.focus();
        }
      },
      [setOpen],
    );

    useEffect(() => {
      return () => {
        if (formResetFormRef.current) {
          formResetFormRef.current.removeEventListener("reset", handleFormReset);
        }
      };
    }, [handleFormReset]);

    useEffect(() => {
      if (inputValueProvided) return;
      if (previousSelectedValueRef.current === selectedValue) return;
      previousSelectedValueRef.current = selectedValue;
      const nextLabel = resolveOptionLabel(options, selectedValue);
      if (nextLabel !== inputValue) {
        setInputValue(nextLabel);
      }
    }, [inputValue, inputValueProvided, options, selectedValue, setInputValue]);

    useLayoutEffect(() => {
      if (!open) {
        setActiveOptionId(null);
        pointerSyncEnabledRef.current = false;
        return;
      }

      setActiveOptionId(
        resolveInitialActiveOptionId(filteredOptions, listboxId, selectedValue),
      );

      pointerSyncEnabledRef.current = false;
      keyboardNavigationRef.current = false;
      const frame = window.requestAnimationFrame(() => {
        pointerSyncEnabledRef.current = true;
      });
      return () => window.cancelAnimationFrame(frame);
    }, [filteredOptions, listboxId, open, selectedValue]);

    useEffect(() => {
      if (!open || !activeOptionId) return;
      scrollComboboxOptionIntoView(
        listboxRef.current,
        document.getElementById(activeOptionId),
      );
    }, [activeOptionId, open]);

    useLayoutEffect(() => {
      const node = inputRef.current;
      if (!node || !required || disabled) return;
      node.setCustomValidity(selectedValue ? "" : "Choose an option.");
    }, [disabled, required, selectedValue]);

    useEffect(() => {
      if (!open) return;
      function handleTabClose(event: globalThis.KeyboardEvent) {
        if (event.key === "Tab") {
          closeListbox({ restoreFocus: false });
        }
      }
      document.addEventListener("keydown", handleTabClose);
      return () => document.removeEventListener("keydown", handleTabClose);
    }, [closeListbox, open]);

    const commitSelection = useCallback(
      (nextValue: string) => {
        const option = options.find((item) => item.value === nextValue);
        if (!option || option.disabled) return;
        setSelectedValue(option.value);
        if (!inputValueProvided) {
          setInputValue(option.label);
        }
        closeListbox({ restoreFocus: true });
      },
      [closeListbox, inputValueProvided, options, setInputValue, setSelectedValue],
    );

    const reconcileInputOnBlur = useCallback(() => {
      if (inputValueProvided || pendingSelectionRef.current) return;
      const exactMatch = findOptionByLabel(options, inputValue);
      if (exactMatch && !exactMatch.disabled) {
        setSelectedValue(exactMatch.value);
        setInputValue(exactMatch.label);
        return;
      }
      setInputValue(resolveOptionLabel(options, selectedValue));
    }, [inputValue, inputValueProvided, options, selectedValue, setInputValue, setSelectedValue]);

    const handleOptionPointerEnter = useCallback(
      (optionId: string, optionDisabled?: boolean) => {
        if (!pointerSyncEnabledRef.current || keyboardNavigationRef.current || optionDisabled) {
          return;
        }
        setActiveOptionId(optionId);
      },
      [],
    );

    const handleListboxPointerMove = useCallback(
      (event: PointerEvent<HTMLUListElement>) => {
        keyboardNavigationRef.current = false;
        if (!pointerSyncEnabledRef.current) return;

        const target = (event.target as HTMLElement).closest<HTMLElement>('[role="option"]');
        if (!target || target.getAttribute("aria-disabled") === "true") return;
        if (target.id) setActiveOptionId(target.id);
      },
      [],
    );

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return;

        if (event.key === "ArrowDown") {
          event.preventDefault();
          keyboardNavigationRef.current = true;
          if (!open) {
            setOpen(true);
            setActiveOptionId(
              resolveInitialActiveOptionId(filteredOptions, listboxId, selectedValue),
            );
            return;
          }
          setActiveOptionId((current) =>
            moveComboboxActiveOptionId(1, current, filteredOptions, listboxId),
          );
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          keyboardNavigationRef.current = true;
          if (!open) {
            setOpen(true);
            setActiveOptionId(
              resolveInitialActiveOptionId(filteredOptions, listboxId, selectedValue),
            );
            return;
          }
          setActiveOptionId((current) =>
            moveComboboxActiveOptionId(-1, current, filteredOptions, listboxId),
          );
          return;
        }

        if (event.key === "Enter" && open) {
          event.preventDefault();
          const activeValue = getComboboxOptionValueFromId(activeOptionId, listboxId);
          if (activeValue) commitSelection(activeValue);
          return;
        }

        if (event.key === "Escape" && open) {
          event.preventDefault();
          event.stopPropagation();
          closeListbox({ restoreFocus: true });
        }
      },
      [
        activeOptionId,
        closeListbox,
        commitSelection,
        disabled,
        filteredOptions,
        listboxId,
        open,
        selectedValue,
        setOpen,
      ],
    );

    const handleOptionPointerDown = useCallback(() => {
      pendingSelectionRef.current = true;
    }, []);

    const handleSelect = useCallback(
      (nextValue: string) => {
        pendingSelectionRef.current = false;
        commitSelection(nextValue);
      },
      [commitSelection],
    );

    return (
      <Popover
        open={open}
        onOpenChange={setOpen}
        placement="bottom"
        align="start"
        focusMode="trigger"
        showArrow={false}
      >
        <div className={cn(styles.controlWrap, className)}>
          {name ? (
            <input type="hidden" name={name} value={selectedValue} disabled={disabled} />
          ) : null}

          <div
            id={listStatusId}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {listStatusAnnouncement}
          </div>

          <PopoverAnchor>
            <div className={styles.inputWrap}>
              <input
                ref={setInputRef}
                id={id}
                type="text"
                role="combobox"
                className={cn(inputStyles.input, styles.input, sizeClass[size])}
                value={inputValue}
                placeholder={placeholder}
                disabled={disabled}
                aria-required={required || undefined}
                aria-invalid={ariaInvalid === true || ariaInvalid === "true" ? true : undefined}
                aria-describedby={inputDescribedBy}
                aria-autocomplete="list"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? listboxId : undefined}
                aria-activedescendant={open && activeOptionId ? activeOptionId : undefined}
                onChange={(event) => {
                  keyboardNavigationRef.current = false;
                  setInputValue(event.target.value);
                  if (!open) setOpen(true);
                }}
                onFocus={() => {
                  if (!disabled) setOpen(true);
                }}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  blurTimeoutRef.current = window.setTimeout(() => {
                    blurTimeoutRef.current = null;
                    if (pendingSelectionRef.current) return;
                    closeListbox({ restoreFocus: false });
                    reconcileInputOnBlur();
                  }, 0);
                }}
                autoComplete="off"
                {...rest}
              />
              <span className={styles.caret} aria-hidden="true">
                <CaretDown size={16} weight="bold" />
              </span>
            </div>
          </PopoverAnchor>
        </div>

        <ComboboxListbox
          listboxId={listboxId}
          listboxLabel={listboxLabel}
          listboxRef={listboxRef}
          filteredOptions={filteredOptions}
          selectedValue={selectedValue}
          activeOptionId={activeOptionId}
          onSelect={handleSelect}
          onOptionPointerEnter={handleOptionPointerEnter}
          onOptionPointerDown={handleOptionPointerDown}
          onListboxPointerMove={handleListboxPointerMove}
          noResultsLabel="No results found"
        />
      </Popover>
    );
  },
);

export type ComboboxProps = ComboboxControlProps & {
  label: string;
  supportingText?: string;
  error?: string;
  hideLabel?: boolean;
};

export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(
  props,
  ref,
) {
  const valueProvided = "value" in props;
  const inputValueProvided = "inputValue" in props;
  const openProvided = "open" in props;
  const {
    label,
    supportingText,
    error,
    hideLabel = false,
    id: idProp,
    required,
    ...controlProps
  } = props;

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
        <ComboboxControl
          ref={ref}
          id={controlId}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          listboxLabel={label}
          valueProvided={valueProvided}
          inputValueProvided={inputValueProvided}
          openProvided={openProvided}
          {...controlProps}
        />
      )}
    </FormField>
  );
});
