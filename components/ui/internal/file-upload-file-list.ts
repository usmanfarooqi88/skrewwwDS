export type FileUploadDisplayItem = {
  id: string;
  file: File;
};

export function createFileItemId(file: File, occurrenceIndex: number): string {
  return `${file.name}:${file.size}:${file.type}:${file.lastModified}:${occurrenceIndex}`;
}

export function buildDisplayItems(files: File[]): FileUploadDisplayItem[] {
  return files.map((file, index) => ({
    id: createFileItemId(file, index),
    file,
  }));
}

function buildFileList(files: File[]): FileList {
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

export function supportsDataTransferFileAssignment(): boolean {
  if (typeof DataTransfer === "undefined") return false;
  const input = document.createElement("input");
  input.type = "file";
  return assignFilesToInput(input, [new File(["test"], "test.txt", { type: "text/plain" })]);
}

export function assignFilesToInput(input: HTMLInputElement, files: File[]): boolean {
  try {
    const transfer = new DataTransfer();
    for (const file of files) {
      transfer.items.add(file);
    }

    input.files = transfer.files;
    if (input.files && input.files.length === files.length) {
      return true;
    }
  } catch {
    // Fall through to defineProperty assignment for environments like jsdom.
  }

  try {
    Object.defineProperty(input, "files", {
      configurable: true,
      value: buildFileList(files),
    });
    return (input.files?.length ?? 0) === files.length;
  } catch {
    return false;
  }
}

export function filesMatchInputSelection(input: HTMLInputElement, files: File[]): boolean {
  const current = Array.from(input.files ?? []);
  return (
    current.length === files.length &&
    current.every((file, index) => file === files[index])
  );
}

export function syncAcceptedFilesToInput(input: HTMLInputElement, files: File[]): boolean {
  if (files.length === 0) {
    clearNativeFileInput(input);
    return (input.files?.length ?? 0) === 0;
  }

  if (filesMatchInputSelection(input, files)) {
    return true;
  }

  return assignFilesToInput(input, files);
}

export function clearNativeFileInput(input: HTMLInputElement): void {
  input.value = "";
  try {
    Object.defineProperty(input, "files", {
      configurable: true,
      value: buildFileList([]),
    });
  } catch {
    // Native reset via value="" is sufficient in browsers that expose an empty FileList.
  }
}
