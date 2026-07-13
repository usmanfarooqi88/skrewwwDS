import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

process.env.NEXT_PUBLIC_SITE_URL ??= "https://skrewww.test";

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

afterEach(() => {
  cleanup();
});
