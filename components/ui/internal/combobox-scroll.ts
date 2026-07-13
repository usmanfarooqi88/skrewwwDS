export function scrollComboboxOptionIntoView(
  listbox: HTMLElement | null,
  option: HTMLElement | null,
): void {
  if (!listbox || !option) return;

  const listboxRect = listbox.getBoundingClientRect();
  const optionRect = option.getBoundingClientRect();
  const fullyVisible =
    optionRect.top >= listboxRect.top && optionRect.bottom <= listboxRect.bottom;

  if (fullyVisible) return;
  option.scrollIntoView({ block: "nearest" });
}
