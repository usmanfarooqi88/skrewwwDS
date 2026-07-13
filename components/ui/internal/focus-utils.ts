const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-disabled") !== "true" &&
      element.tabIndex !== -1,
  );
}

export function getFocusableElementsForScope(
  container: HTMLElement,
  overlayScopeId?: string,
): HTMLElement[] {
  const focusables = getFocusableElements(container);

  if (!overlayScopeId || typeof document === "undefined") {
    return focusables;
  }

  const scopedNodes = Array.from(
    document.querySelectorAll<HTMLElement>(
      `[data-skrewww-overlay-scope="${overlayScopeId}"]`,
    ),
  );

  for (const scopedNode of scopedNodes) {
    focusables.push(...getFocusableElements(scopedNode));
  }

  return focusables.filter(
    (element, index, array) => array.indexOf(element) === index,
  );
}

export function resolveInitialFocusTarget(
  container: HTMLElement,
  initialFocusRef?: React.RefObject<HTMLElement | null>,
  overlayScopeId?: string,
): HTMLElement {
  const initial = initialFocusRef?.current;
  if (initial && container.contains(initial)) {
    return initial;
  }

  const focusables = getFocusableElementsForScope(container, overlayScopeId);
  return focusables[0] ?? container;
}

export function restoreFocusSafely(
  primary: HTMLElement | null | undefined,
  fallback?: HTMLElement | null,
) {
  const target = primary && document.contains(primary) ? primary : fallback;
  target?.focus?.();
}
