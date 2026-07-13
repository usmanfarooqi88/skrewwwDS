import type { ComboboxOptionLike } from "@/components/ui/internal/combobox-filter";

export function getEnabledComboboxOptions(options: ComboboxOptionLike[]): ComboboxOptionLike[] {
  return options.filter((option) => !option.disabled);
}

export function getComboboxOptionId(listboxId: string, value: string): string {
  return `${listboxId}-${value}`;
}

export function resolveInitialActiveOptionId(
  filteredOptions: ComboboxOptionLike[],
  listboxId: string,
  selectedValue: string,
): string | null {
  const enabled = getEnabledComboboxOptions(filteredOptions);
  if (enabled.length === 0) return null;
  const selected = enabled.find((option) => option.value === selectedValue);
  const target = selected ?? enabled[0];
  return getComboboxOptionId(listboxId, target.value);
}

export function moveComboboxActiveOptionId(
  direction: 1 | -1,
  activeOptionId: string | null,
  filteredOptions: ComboboxOptionLike[],
  listboxId: string,
): string | null {
  const enabled = getEnabledComboboxOptions(filteredOptions);
  if (enabled.length === 0) return null;

  const optionIds = enabled.map((option) => getComboboxOptionId(listboxId, option.value));
  const currentIndex = activeOptionId ? optionIds.indexOf(activeOptionId) : -1;

  let nextIndex = currentIndex + direction;
  if (currentIndex === -1) {
    nextIndex = direction === 1 ? 0 : enabled.length - 1;
  } else {
    nextIndex = Math.max(0, Math.min(enabled.length - 1, nextIndex));
  }

  return optionIds[nextIndex] ?? null;
}

export function getComboboxOptionValueFromId(
  activeOptionId: string | null,
  listboxId: string,
): string | null {
  if (!activeOptionId || !activeOptionId.startsWith(`${listboxId}-`)) return null;
  return activeOptionId.slice(listboxId.length + 1);
}
