type OverlayRegistration = {
  id: symbol;
  order: number;
  onEscape: () => void;
  modal: boolean;
};

let orderCounter = 0;
const overlayStack: OverlayRegistration[] = [];
let escapeListenerBound = false;

function handleDocumentEscape(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  const top = overlayStack[overlayStack.length - 1];
  if (!top) return;
  event.preventDefault();
  event.stopPropagation();
  top.onEscape();
}

function ensureEscapeListener() {
  if (escapeListenerBound || typeof document === "undefined") return;
  document.addEventListener("keydown", handleDocumentEscape);
  escapeListenerBound = true;
}

export function registerOverlay(
  onEscape: () => void,
  options?: { modal?: boolean },
): () => void {
  ensureEscapeListener();

  const registration: OverlayRegistration = {
    id: Symbol("overlay"),
    order: ++orderCounter,
    onEscape,
    modal: options?.modal ?? false,
  };

  overlayStack.push(registration);
  overlayStack.sort((left, right) => left.order - right.order);

  return () => {
    const index = overlayStack.findIndex((entry) => entry.id === registration.id);
    if (index >= 0) overlayStack.splice(index, 1);
  };
}

export function getTopOverlay(): OverlayRegistration | undefined {
  return overlayStack[overlayStack.length - 1];
}

export function clearOverlayStackForTests() {
  overlayStack.length = 0;
}
