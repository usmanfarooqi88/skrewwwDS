export type MenuTypeaheadItem = {
  id: string;
  text: string;
  disabled?: boolean;
};

export type MenuTypeaheadController = {
  handleKey: (key: string) => boolean;
  reset: () => void;
};

export function createMenuTypeahead({
  getItems,
  onMatch,
  timeoutMs = 500,
}: {
  getItems: () => MenuTypeaheadItem[];
  onMatch: (id: string) => void;
  timeoutMs?: number;
}): MenuTypeaheadController {
  let buffer = "";
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastChar = "";
  let cycleIndex = 0;

  function reset() {
    buffer = "";
    lastChar = "";
    cycleIndex = 0;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function scheduleReset() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(reset, timeoutMs);
  }

  function handleKey(key: string): boolean {
    if (key.length !== 1 || key === " ") return false;

    const enabledItems = getItems().filter((item) => !item.disabled);
    const lowerKey = key.toLowerCase();

    if (lowerKey === lastChar.toLowerCase()) {
      const matches = enabledItems.filter((item) =>
        item.text.toLowerCase().startsWith(lowerKey),
      );
      if (matches.length === 0) return false;
      cycleIndex = (cycleIndex + 1) % matches.length;
      onMatch(matches[cycleIndex].id);
      scheduleReset();
      return true;
    }

    buffer += lowerKey;
    lastChar = key;
    const matches = enabledItems.filter((item) => item.text.toLowerCase().startsWith(buffer));
    if (matches.length === 0) {
      buffer = lowerKey;
      const single = enabledItems.filter((item) => item.text.toLowerCase().startsWith(buffer));
      if (single.length === 0) {
        reset();
        return false;
      }
      cycleIndex = 0;
      onMatch(single[0].id);
      scheduleReset();
      return true;
    }

    cycleIndex = 0;
    onMatch(matches[0].id);
    scheduleReset();
    return true;
  }

  return { handleKey, reset };
}
