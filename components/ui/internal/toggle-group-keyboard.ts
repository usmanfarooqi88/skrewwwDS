/**
 * Keyboard navigation for Toggle Group (radiogroup / radio).
 * Arrow keys move focus and select (automatic activation).
 */

export function getToggleGroupRadios(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>('[role="radio"]')).filter(
    (element) =>
      !element.hasAttribute("disabled") && element.getAttribute("aria-disabled") !== "true",
  );
}

export function handleToggleGroupKeyDown(
  event: React.KeyboardEvent<HTMLElement>,
  orientation: "horizontal" | "vertical",
  onSelect: (value: string) => void,
) {
  const target = event.currentTarget;
  if (target.getAttribute("role") !== "radio") return;

  const container = target.closest('[role="radiogroup"]') as HTMLElement | null;
  const items = getToggleGroupRadios(container);
  const currentIndex = items.indexOf(target);
  if (currentIndex === -1 || items.length === 0) return;

  const previousKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
  const nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";

  let nextIndex = currentIndex;
  if (event.key === previousKey) {
    event.preventDefault();
    nextIndex = (currentIndex - 1 + items.length) % items.length;
  } else if (event.key === nextKey) {
    event.preventDefault();
    nextIndex = (currentIndex + 1) % items.length;
  } else if (event.key === "Home") {
    event.preventDefault();
    nextIndex = 0;
  } else if (event.key === "End") {
    event.preventDefault();
    nextIndex = items.length - 1;
  } else if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    const value = target.getAttribute("data-value");
    if (value != null) onSelect(value);
    return;
  } else {
    return;
  }

  const next = items[nextIndex];
  next?.focus();
  const value = next?.getAttribute("data-value");
  if (value != null) onSelect(value);
}
