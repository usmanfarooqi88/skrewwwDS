export function getTabFocusables(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]')).filter(
    (element) =>
      !element.hasAttribute("disabled") && element.getAttribute("aria-disabled") !== "true",
  );
}

export function handleTabListKeyDown(
  event: React.KeyboardEvent<HTMLElement>,
  orientation: "horizontal" | "vertical" = "horizontal",
) {
  const target = event.currentTarget;
  if (target.getAttribute("role") !== "tab") return;

  const container = target.closest('[role="tablist"]') as HTMLElement | null;
  const items = getTabFocusables(container);
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
  } else {
    return;
  }

  items[nextIndex]?.focus();
}
