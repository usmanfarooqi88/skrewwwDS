export type ComboboxOptionLike = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type ComboboxFilterMode = "prefix" | "substring";

export function filterComboboxOptions(
  options: ComboboxOptionLike[],
  query: string,
  mode: ComboboxFilterMode = "prefix",
): ComboboxOptionLike[] {
  const trimmed = query.trim();
  if (!trimmed) return options;

  const normalizedQuery = trimmed.toLocaleLowerCase();
  return options.filter((option) => {
    const normalizedLabel = option.label.toLocaleLowerCase();
    return mode === "prefix"
      ? normalizedLabel.startsWith(normalizedQuery)
      : normalizedLabel.includes(normalizedQuery);
  });
}

export function findOptionByLabel(
  options: ComboboxOptionLike[],
  label: string,
): ComboboxOptionLike | undefined {
  const normalized = label.trim().toLocaleLowerCase();
  if (!normalized) return undefined;

  const matches = options.filter(
    (option) => option.label.trim().toLocaleLowerCase() === normalized,
  );
  if (matches.length !== 1) return undefined;
  return matches[0];
}

export function resolveOptionLabel(
  options: ComboboxOptionLike[],
  value: string,
): string {
  if (!value) return "";
  return options.find((option) => option.value === value)?.label ?? "";
}
