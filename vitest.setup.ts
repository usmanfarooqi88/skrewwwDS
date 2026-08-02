import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

process.env.NEXT_PUBLIC_SITE_URL ??= "https://skrewww.test";

/**
 * The real server-only package throws unconditionally unless resolved
 * through Next.js's build pipeline, which swaps in a no-op for server
 * contexts. Vitest has no equivalent — without this, any test importing a
 * module that does `import "server-only"` (e.g. lib/server/*) fails before
 * a single test runs, regardless of what that module actually does.
 */
vi.mock("server-only", () => ({}));

class TestDataTransferItemList {
  private readonly files: File[] = [];

  add(file: File): void {
    this.files.push(file);
  }

  get length(): number {
    return this.files.length;
  }

  toArray(): File[] {
    return [...this.files];
  }

  [Symbol.iterator](): IterableIterator<File> {
    return this.files[Symbol.iterator]();
  }
}

class TestDataTransfer {
  readonly items = new TestDataTransferItemList();

  get files(): FileList {
    const files = this.items.toArray();
    const list = {
      length: files.length,
      item: (index: number) => files[index] ?? null,
      [Symbol.iterator]: () => files[Symbol.iterator](),
    } as FileList;

    files.forEach((file, index) => {
      Object.defineProperty(list, index, { value: file, enumerable: true });
    });

    return list;
  }
}

globalThis.DataTransfer = TestDataTransfer as unknown as typeof DataTransfer;

/**
 * jsdom has no layout engine — every element's real getBoundingClientRect()
 * reports 0x0, and jsdom doesn't implement ResizeObserver at all. Components
 * that measure their container (e.g. recharts's ResponsiveContainer) rely on
 * the ResizeObserver callback's entry.contentRect for sizing, not a second
 * getBoundingClientRect() read — so this mock invokes the callback
 * synchronously on observe() with a fixed, nonzero test size. That's enough
 * for ResponsiveContainer to render real (non-zero-size) chart content in
 * tests; it does not attempt to model actual reflow.
 */
class TestResizeObserver implements ResizeObserver {
  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element): void {
    const rect = {
      width: 800,
      height: 400,
      top: 0,
      left: 0,
      bottom: 400,
      right: 800,
      x: 0,
      y: 0,
      toJSON() {
        return this;
      },
    };
    this.callback(
      [{ target, contentRect: rect, borderBoxSize: [], contentBoxSize: [], devicePixelContentBoxSize: [] } as unknown as ResizeObserverEntry],
      this,
    );
  }

  unobserve(): void {}

  disconnect(): void {}
}

globalThis.ResizeObserver ??= TestResizeObserver;

afterEach(() => {
  cleanup();
});
