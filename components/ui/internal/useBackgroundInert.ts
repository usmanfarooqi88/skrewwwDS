import { useEffect, useRef } from "react";

type InertSnapshot = {
  element: HTMLElement;
  previous: boolean;
};

let modalInertCount = 0;
const snapshots: InertSnapshot[] = [];

export function supportsInert(): boolean {
  return typeof HTMLElement !== "undefined" && "inert" in HTMLElement.prototype;
}

function applyBackgroundInert(excludeElement: HTMLElement | null) {
  if (!supportsInert()) return;

  for (const child of Array.from(document.body.children)) {
    if (!(child instanceof HTMLElement)) continue;
    if (excludeElement && (child === excludeElement || child.contains(excludeElement))) continue;

    snapshots.push({ element: child, previous: child.inert });
    child.inert = true;
  }
}

function restoreBackgroundInert() {
  for (const snapshot of snapshots) {
    snapshot.element.inert = snapshot.previous;
  }
  snapshots.length = 0;
}

export function resetBackgroundInertForTests() {
  modalInertCount = 0;
  restoreBackgroundInert();
}

export function useBackgroundInert(active: boolean, excludeElement: HTMLElement | null) {
  const excludeRef = useRef(excludeElement);
  excludeRef.current = excludeElement;

  useEffect(() => {
    if (!active) return;

    modalInertCount += 1;
    if (modalInertCount === 1) {
      applyBackgroundInert(excludeRef.current);
    }

    return () => {
      modalInertCount -= 1;
      if (modalInertCount === 0) {
        restoreBackgroundInert();
      }
    };
  }, [active]);
}
