"use client";

import { CaretDown } from "@phosphor-icons/react";
import {
  forwardRef,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type Ref,
  type RefObject,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import { FormField } from "@/components/ui/FormField";
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  usePopoverOpen,
  usePopoverSetOpen,
  usePopoverRequestClose,
} from "@/components/ui/Popover";
import { useControllableState } from "@/lib/use-controllable";
import inputStyles from "@/components/ui/text-input.module.css";
import styles from "@/components/ui/select.module.css";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectOptionGroup = {
  label: string;
  options: SelectOption[];
};

export type SelectSize = "sm" | "md" | "lg";

export type SelectControlProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> & {
  size?: SelectSize;
  options: SelectOption[];
  groups?: SelectOptionGroup[];
  placeholder?: string;
};

const sizeClass: Record<SelectSize, string> = {
  sm: inputStyles.sizeSm,
  md: inputStyles.sizeMd,
  lg: inputStyles.sizeLg,
};

function flattenOptions(
  options: SelectOption[],
  groups?: SelectOptionGroup[],
): SelectOption[] {
  if (groups?.length) {
    return groups.flatMap((group) => group.options);
  }
  return options;
}

function getEnabledOptionButtons(listbox: ParentNode): HTMLButtonElement[] {
  return Array.from(
    listbox.querySelectorAll<HTMLButtonElement>('button[role="option"]:not(:disabled)'),
  );
}

/** Moves DOM focus between enabled listbox options. Returns true when the key was handled. */
function focusListboxOptionByKey(listbox: ParentNode, key: string): boolean {
  const buttons = getEnabledOptionButtons(listbox);
  if (buttons.length === 0) return false;

  const activeIndex = buttons.findIndex((button) => button === document.activeElement);

  if (key === "ArrowDown") {
    buttons[Math.min(activeIndex + 1, buttons.length - 1)]?.focus();
    return true;
  }
  if (key === "ArrowUp") {
    buttons[Math.max(activeIndex - 1, 0)]?.focus();
    return true;
  }
  if (key === "Home") {
    buttons[0]?.focus();
    return true;
  }
  if (key === "End") {
    buttons[buttons.length - 1]?.focus();
    return true;
  }
  return false;
}

function renderNativeOptions(options: SelectOption[]) {
  return options.map((option) => (
    <option key={option.value} value={option.value} disabled={option.disabled}>
      {option.label}
    </option>
  ));
}

function getDisplayLabel(
  value: string,
  placeholder: string | undefined,
  options: SelectOption[],
  groups?: SelectOptionGroup[],
): string {
  if (!value) return placeholder ?? "";
  return flattenOptions(options, groups).find((option) => option.value === value)?.label ?? "";
}

type ListboxOptionProps = {
  option: SelectOption;
  selected: boolean;
  onSelect: (value: string) => void;
  optionRef?: Ref<HTMLButtonElement>;
  optionId: string;
};

function ListboxOption({ option, selected, onSelect, optionRef, optionId }: ListboxOptionProps) {
  return (
    <li role="presentation" className={styles.optionItem}>
      <button
        ref={optionRef}
        id={optionId}
        type="button"
        role="option"
        aria-selected={selected}
        disabled={option.disabled}
        className={cn(styles.option, selected && styles.optionSelected)}
        onClick={() => onSelect(option.value)}
      >
        {option.label}
      </button>
    </li>
  );
}

type SelectTriggerButtonProps = {
  listboxId: string;
  listboxLabel: string;
  id?: string;
  size: SelectSize;
  disabled?: boolean;
  required?: boolean;
  ariaInvalid?: boolean | "true" | "false" | "grammar" | "spelling";
  ariaDescribedBy?: string;
  displayLabel: string;
  isPlaceholder: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

function SelectTriggerButton({
  listboxId,
  listboxLabel,
  id,
  size,
  disabled,
  required,
  ariaInvalid,
  ariaDescribedBy,
  displayLabel,
  isPlaceholder,
  triggerRef,
}: SelectTriggerButtonProps) {
  const open = usePopoverOpen();
  const setOpen = usePopoverSetOpen();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        event.preventDefault();
        setOpen(true);
        return;
      }
      if (
        open &&
        (event.key === "ArrowDown" ||
          event.key === "ArrowUp" ||
          event.key === "Home" ||
          event.key === "End")
      ) {
        const listbox = document.getElementById(listboxId);
        if (!listbox) return;
        event.preventDefault();
        focusListboxOptionByKey(listbox, event.key);
      }
    },
    [disabled, listboxId, open, setOpen],
  );

  return (
    <PopoverTrigger>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        className={cn(inputStyles.input, styles.trigger, sizeClass[size])}
        disabled={disabled}
        aria-required={required || undefined}
        aria-invalid={ariaInvalid === true || ariaInvalid === "true" ? true : undefined}
        aria-describedby={ariaDescribedBy}
        aria-haspopup="listbox"
        aria-autocomplete="none"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onMouseDown={(event) => {
          if (disabled || event.button !== 0) return;
          // Prevent the combobox from reclaiming focus on mouseup/click after
          // PopoverContent moves it into the listbox. Click still toggles open.
          event.preventDefault();
        }}
        onKeyDown={handleKeyDown}
      >
        <span className={cn(styles.triggerLabel, isPlaceholder && styles.placeholder)}>
          {displayLabel}
        </span>
      </button>
    </PopoverTrigger>
  );
}

type SelectListboxProps = {
  listboxId: string;
  listboxLabel: string;
  options: SelectOption[];
  groups?: SelectOptionGroup[];
  resolvedValue: string;
  disabled?: boolean;
  onSelect: (value: string) => void;
  initialFocusRef: RefObject<HTMLButtonElement | null>;
};

function SelectListbox({
  listboxId,
  listboxLabel,
  options,
  groups,
  resolvedValue,
  disabled,
  onSelect,
  initialFocusRef,
}: SelectListboxProps) {
  const requestClose = usePopoverRequestClose();

  const handleOptionSelect = useCallback(
    (nextValue: string) => {
      if (disabled) return;
      const option = flattenOptions(options, groups).find((item) => item.value === nextValue);
      if (!option || option.disabled) return;
      onSelect(nextValue);
      requestClose({ restoreFocus: true });
    },
    [disabled, groups, onSelect, options, requestClose],
  );

  const handleListboxKeyDown = useCallback((event: KeyboardEvent<HTMLUListElement>) => {
    if (focusListboxOptionByKey(event.currentTarget, event.key)) {
      event.preventDefault();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const active = document.activeElement;
      if (active instanceof HTMLButtonElement && active.getAttribute("role") === "option") {
        active.click();
      }
    }
  }, []);

  const renderListboxOptions = (listOptions: SelectOption[]) => {
    const selectedOption = listOptions.find(
      (option) => option.value === resolvedValue && !option.disabled,
    );
    const initialFocusValue =
      selectedOption?.value ?? listOptions.find((option) => !option.disabled)?.value;

    return listOptions.map((option) => (
      <ListboxOption
        key={option.value}
        option={option}
        selected={option.value === resolvedValue}
        onSelect={handleOptionSelect}
        optionRef={option.value === initialFocusValue ? initialFocusRef : undefined}
        optionId={`${listboxId}-${option.value}`}
      />
    ));
  };

  return (
    <PopoverContent
      initialFocusRef={initialFocusRef as RefObject<HTMLElement | null>}
      className={styles.listboxPopover}
      matchTriggerWidth
    >
      <PopoverBody className={styles.listboxBody}>
        <ul
          id={listboxId}
          role="listbox"
          aria-label={listboxLabel}
          aria-activedescendant={resolvedValue ? `${listboxId}-${resolvedValue}` : undefined}
          className={styles.listbox}
          onKeyDown={handleListboxKeyDown}
        >
          {groups?.length
            ? groups.map((group) => (
                <li key={group.label} role="presentation" className={styles.group}>
                  <span className={styles.groupLabel}>{group.label}</span>
                  <ul role="group" aria-label={group.label} className={styles.groupList}>
                    {renderListboxOptions(group.options)}
                  </ul>
                </li>
              ))
            : renderListboxOptions(options)}
        </ul>
      </PopoverBody>
    </PopoverContent>
  );
}

export const SelectControl = forwardRef<HTMLSelectElement, SelectControlProps & { valueProvided?: boolean; listboxLabel?: string }>(
  function SelectControl(
    {
      size = "md",
      options,
      groups,
      placeholder,
      className,
      disabled,
      required,
      value,
      defaultValue,
      id,
      onChange,
      valueProvided = false,
      listboxLabel = "Options",
      "aria-invalid": ariaInvalid,
      "aria-describedby": ariaDescribedBy,
      name,
      ...selectProps
    },
    ref,
  ) {
    const listboxId = useId();
    const nativeSelectRef = useRef<HTMLSelectElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const initialFocusRef = useRef<HTMLButtonElement | null>(null);
    const validationRef = useRef<HTMLInputElement | null>(null);
    const showPlaceholder = Boolean(placeholder);

    const [currentValue, setCurrentValue] = useControllableState<string | undefined>({
      value: value as string | undefined,
      defaultValue: (defaultValue as string | undefined) ?? (showPlaceholder ? "" : undefined),
      valueProvided,
    });

    const resolvedValue = currentValue ?? "";
    const displayLabel = getDisplayLabel(resolvedValue, placeholder, options, groups);
    const isPlaceholder = !resolvedValue && Boolean(placeholder);

    const setSelectRef = useCallback(
      (node: HTMLSelectElement | null) => {
        nativeSelectRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    const commitValue = useCallback(
      (nextValue: string) => {
        setCurrentValue(nextValue);
        const select = nativeSelectRef.current;
        if (!select) return;
        select.value = nextValue;
        onChange?.({
          target: select,
          currentTarget: select,
        } as unknown as ChangeEvent<HTMLSelectElement>);
      },
      [onChange, setCurrentValue],
    );

    useLayoutEffect(() => {
      const node = validationRef.current;
      if (!node || !required || disabled) return;
      node.setCustomValidity(resolvedValue ? "" : "Choose an option.");
    }, [disabled, required, resolvedValue]);

    return (
      <Popover placement="bottom" align="start" focusMode="content" showArrow={false}>
        <div className={cn(styles.controlWrap, className)}>
          {name ? (
            <input
              type="hidden"
              name={name}
              value={resolvedValue}
              disabled={disabled}
            />
          ) : null}
          {required && !disabled ? (
            <input
              ref={validationRef}
              data-testid="select-validation-input"
              type="text"
              className={styles.validationInput}
              value={resolvedValue ? resolvedValue : ""}
              required
              tabIndex={-1}
              onChange={() => {}}
            />
          ) : null}
          <select
            ref={setSelectRef}
            className={styles.nativeSelect}
            disabled={disabled}
            aria-hidden="true"
            tabIndex={-1}
            value={resolvedValue}
            // This mirror is visually and programmatically unreachable
            // (position: absolute off-screen, pointer-events: none,
            // tabIndex=-1) — its value is only ever set imperatively via
            // commitValue, which never dispatches a native change event, so
            // this handler can't fire from real interaction. commitValue
            // already calls the consumer's onChange manually. A no-op here
            // (matching the validation input above) keeps this a valid
            // controlled element without silently dropping the consumer's
            // handler into a dead code path.
            onChange={() => {}}
            {...selectProps}
          >
            {showPlaceholder ? (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            ) : null}
            {groups?.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {renderNativeOptions(group.options)}
              </optgroup>
            ))}
            {!groups?.length ? renderNativeOptions(options) : null}
          </select>

          <SelectTriggerButton
            listboxId={listboxId}
            listboxLabel={listboxLabel}
            id={id}
            size={size}
            disabled={disabled}
            required={required}
            ariaInvalid={ariaInvalid}
            ariaDescribedBy={ariaDescribedBy}
            displayLabel={displayLabel}
            isPlaceholder={isPlaceholder}
            triggerRef={triggerRef}
          />

          <span className={styles.caret} aria-hidden="true">
            <CaretDown size={16} weight="bold" />
          </span>
        </div>

        <SelectListbox
          listboxId={listboxId}
          listboxLabel={listboxLabel}
          options={options}
          groups={groups}
          resolvedValue={resolvedValue}
          disabled={disabled}
          onSelect={commitValue}
          initialFocusRef={initialFocusRef}
        />
      </Popover>
    );
  },
);

export type SelectProps = SelectControlProps & {
  label: string;
  supportingText?: string;
  error?: string;
  hideLabel?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
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
        <SelectControl
          ref={ref}
          id={controlId}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          valueProvided={valueProvided}
          listboxLabel={label}
          {...controlProps}
        />
      )}
    </FormField>
  );
});
