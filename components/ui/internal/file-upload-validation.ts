export type FileUploadRejectionCode = "file-type" | "file-size" | "max-files";

export type FileUploadRejection = {
  file: File;
  code: FileUploadRejectionCode;
  message: string;
};

export function parseAcceptTokens(accept?: string): string[] {
  if (!accept?.trim()) return [];
  return accept
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

export function fileMatchesAccept(file: File, accept?: string): boolean {
  const tokens = parseAcceptTokens(accept);
  if (!tokens.length) return true;

  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  return tokens.some((token) => {
    if (token.startsWith(".")) {
      return fileName.endsWith(token);
    }
    if (token.endsWith("/*")) {
      const prefix = token.slice(0, -1);
      return fileType.startsWith(prefix);
    }
    return fileType === token;
  });
}

export function buildRejectionMessage(
  file: File,
  code: FileUploadRejectionCode,
  maxSize?: number,
  maxFiles?: number,
): string {
  switch (code) {
    case "file-type":
      return `${file.name} is not an accepted file type.`;
    case "file-size":
      return `${file.name} exceeds the ${formatBytes(maxSize ?? 0)} limit.`;
    case "max-files":
      return `${file.name} exceeds the maximum of ${maxFiles ?? 1} file${maxFiles === 1 ? "" : "s"}.`;
    default:
      return `${file.name} was rejected.`;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateFileBatch(options: {
  files: File[];
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
}): { accepted: File[]; rejected: FileUploadRejection[] } {
  const { files, accept, maxSize, maxFiles, multiple = false } = options;
  const accepted: File[] = [];
  const rejected: FileUploadRejection[] = [];
  const limit = multiple ? maxFiles ?? Number.POSITIVE_INFINITY : 1;

  for (const file of files) {
    if (!fileMatchesAccept(file, accept)) {
      rejected.push({
        file,
        code: "file-type",
        message: buildRejectionMessage(file, "file-type"),
      });
      continue;
    }

    if (maxSize !== undefined && file.size > maxSize) {
      rejected.push({
        file,
        code: "file-size",
        message: buildRejectionMessage(file, "file-size", maxSize),
      });
      continue;
    }

    if (accepted.length >= limit) {
      rejected.push({
        file,
        code: "max-files",
        message: buildRejectionMessage(file, "max-files", maxSize, multiple ? maxFiles ?? limit : 1),
      });
      continue;
    }

    accepted.push(file);
  }

  return { accepted, rejected };
}
