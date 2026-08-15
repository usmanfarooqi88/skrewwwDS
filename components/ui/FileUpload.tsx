"use client";

import { UploadSimple, X } from "@phosphor-icons/react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { FormField } from "@/components/ui/FormField";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/file-upload.module.css";
import {
  assignFilesToInput,
  buildDisplayItems,
  clearNativeFileInput,
  syncAcceptedFilesToInput,
  type FileUploadDisplayItem,
} from "@/components/ui/internal/file-upload-file-list";
import {
  formatBytes,
  validateFileBatch,
  type FileUploadRejection,
} from "@/components/ui/internal/file-upload-validation";

export type { FileUploadRejection, FileUploadRejectionCode } from "@/components/ui/internal/file-upload-validation";

export type FileUploadProps = {
  id?: string;
  name: string;
  label: string;
  supportingText?: string;
  error?: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  required?: boolean;
  disabled?: boolean;
  onFilesChange?: (files: File[]) => void;
  onRejectedFiles?: (rejections: FileUploadRejection[]) => void;
  className?: string;
};

function buildStatusMessage(
  acceptedCount: number,
  rejectedCount: number,
  removedFileName?: string,
  cleared?: boolean,
): string {
  if (cleared) return "Selection cleared.";
  if (removedFileName) return `${removedFileName} removed.`;
  if (acceptedCount > 0 && rejectedCount > 0) {
    return `${acceptedCount} file${acceptedCount === 1 ? "" : "s"} selected. ${rejectedCount} file${rejectedCount === 1 ? " was" : "s were"} rejected.`;
  }
  if (rejectedCount > 0) {
    return `${rejectedCount} file${rejectedCount === 1 ? " was" : "s were"} rejected.`;
  }
  if (acceptedCount > 0) {
    return `${acceptedCount} file${acceptedCount === 1 ? "" : "s"} selected.`;
  }
  return "";
}

export function FileUpload({
  id,
  name,
  label,
  supportingText,
  error,
  accept,
  multiple = false,
  maxFiles,
  maxSize,
  required = false,
  disabled = false,
  onFilesChange,
  onRejectedFiles,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const dragAnnouncedRef = useRef(false);
  const removeButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [items, setItems] = useState<FileUploadDisplayItem[]>([]);
  const [rejections, setRejections] = useState<FileUploadRejection[]>([]);
  const [dragging, setDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [syncUnavailable, setSyncUnavailable] = useState(false);
  const rejectionListId = useId();
  const statusId = useId();

  const showFieldError = Boolean(error);
  const showRejections = rejections.length > 0 && !showFieldError;

  const applyFallbackClear = useCallback(
    (announce = true) => {
      if (inputRef.current) {
        clearNativeFileInput(inputRef.current);
      }
      setItems([]);
      setRejections([]);
      setSyncUnavailable(true);
      onFilesChange?.([]);
      if (announce) {
        setStatusMessage("Selection cleared.");
      }
    },
    [onFilesChange],
  );

  const commitSelection = useCallback(
    (incoming: File[]) => {
      const { accepted, rejected } = validateFileBatch({
        files: incoming,
        accept,
        maxSize,
        maxFiles,
        multiple,
      });

      if (!inputRef.current) return;

      if (accepted.length === 0) {
        clearNativeFileInput(inputRef.current);
        setItems([]);
        setRejections(rejected);
        setSyncUnavailable(false);
        onFilesChange?.([]);
        if (rejected.length) {
          onRejectedFiles?.(rejected);
        }
        setStatusMessage(buildStatusMessage(0, rejected.length));
        return;
      }

      if (!syncAcceptedFilesToInput(inputRef.current, accepted)) {
        applyFallbackClear(true);
        return;
      }

      setSyncUnavailable(false);
      setItems(buildDisplayItems(accepted));
      setRejections(rejected);
      onFilesChange?.(accepted);
      if (rejected.length) {
        onRejectedFiles?.(rejected);
      }
      setStatusMessage(buildStatusMessage(accepted.length, rejected.length));
    },
    [accept, applyFallbackClear, maxFiles, maxSize, multiple, onFilesChange, onRejectedFiles],
  );

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextFiles = event.target.files ? Array.from(event.target.files) : [];
      commitSelection(nextFiles);
    },
    [commitSelection],
  );

  const handleDragEnter = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (disabled) return;
      dragDepthRef.current += 1;
      setDragging(true);
      if (!dragAnnouncedRef.current) {
        dragAnnouncedRef.current = true;
        setStatusMessage("Files ready to drop.");
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setDragging(false);
      dragAnnouncedRef.current = false;
    }
  }, []);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      dragDepthRef.current = 0;
      dragAnnouncedRef.current = false;
      setDragging(false);
      if (disabled) return;

      const dropped = event.dataTransfer?.files
        ? Array.from(event.dataTransfer.files)
        : [];
      commitSelection(dropped);
    },
    [commitSelection, disabled],
  );

  const handleRemove = useCallback(
    (item: FileUploadDisplayItem) => {
      const remaining = items.filter((entry) => entry.id !== item.id);
      if (!inputRef.current) return;

      if (remaining.length === 0) {
        clearNativeFileInput(inputRef.current);
        setItems([]);
        setRejections([]);
        onFilesChange?.([]);
        setStatusMessage(buildStatusMessage(0, 0, item.file.name));
        inputRef.current.focus();
        return;
      }

      if (!syncAcceptedFilesToInput(inputRef.current, remaining.map((entry) => entry.file))) {
        applyFallbackClear(true);
        return;
      }

      setItems(remaining);
      onFilesChange?.(remaining.map((entry) => entry.file));
      setStatusMessage(buildStatusMessage(0, 0, item.file.name));

      const index = items.findIndex((entry) => entry.id === item.id);
      const next = remaining[index];
      const previous = remaining[index - 1];
      if (next) {
        removeButtonRefs.current.get(next.id)?.focus();
      } else if (previous) {
        removeButtonRefs.current.get(previous.id)?.focus();
      } else {
        inputRef.current.focus();
      }
    },
    [applyFallbackClear, items, onFilesChange],
  );

  useEffect(() => {
    const input = inputRef.current;
    const form = input?.form;
    if (!form || !input) return;

    const handleReset = () => {
      window.requestAnimationFrame(() => {
        setItems([]);
        setRejections([]);
        setDragging(false);
        setSyncUnavailable(false);
        dragDepthRef.current = 0;
        dragAnnouncedRef.current = false;
        setStatusMessage("Selection cleared.");
      });
    };

    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, []);

  const dropzoneLabel = items.length
    ? `${items.length} file${items.length === 1 ? "" : "s"} selected. Choose replacement files.`
    : multiple
      ? "Drag and drop files here or browse to choose files"
      : "Drag and drop a file here or browse to choose a file";

  return (
    <FormField
      label={label}
      controlId={id}
      required={required}
      supportingText={supportingText}
      error={error}
      className={className}
    >
      {({ controlId, describedBy, invalid }) => {
        const describedByIds = [
          describedBy,
          showRejections ? rejectionListId : undefined,
          statusMessage ? statusId : undefined,
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div className={styles.root}>
            <div
              className={cn(
                styles.dropzone,
                items.length === 0 && styles.dropzoneEmpty,
                dragging && styles.dropzoneDragging,
                (invalid || showRejections) && styles.dropzoneError,
                disabled && styles.dropzoneDisabled,
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                id={controlId}
                name={name}
                type="file"
                accept={accept}
                multiple={multiple}
                required={required}
                disabled={disabled}
                aria-invalid={invalid || showRejections || undefined}
                aria-describedby={describedByIds || undefined}
                className={styles.nativeInput}
                onChange={handleInputChange}
              />
              <div className={styles.dropzoneContent} aria-hidden="true">
                <UploadSimple className={styles.icon} weight="regular" aria-hidden="true" />
                <p className={styles.title}>{dropzoneLabel}</p>
                <p className={styles.description}>
                  {accept ? `Accepted: ${accept}` : "All file types accepted"}
                  {maxSize !== undefined ? ` · Max ${formatBytes(maxSize)}` : ""}
                  {multiple && maxFiles !== undefined ? ` · Up to ${maxFiles} files` : ""}
                </p>
              </div>
            </div>

            {syncUnavailable ? (
              <p className={styles.description} role="note">
                File selection was cleared because this browser cannot keep the native file input synchronized with the visible list.
              </p>
            ) : null}

            {showRejections ? (
              <ul id={rejectionListId} className={styles.rejectionList} aria-label="Rejected files">
                {rejections.map((rejection) => (
                  <li key={`${rejection.file.name}-${rejection.file.size}-${rejection.message}`} className={styles.rejectionItem}>
                    {rejection.message}
                  </li>
                ))}
              </ul>
            ) : null}

            {items.length > 0 ? (
              <ul className={styles.fileList} aria-label="Selected files">
                {items.map((item) => (
                  <li key={item.id} className={styles.fileItem}>
                    <div className={styles.fileMeta}>
                      <p className={styles.fileName}>{item.file.name}</p>
                      <p className={styles.fileDetails}>
                        {formatBytes(item.file.size)}
                        {item.file.type ? ` · ${item.file.type}` : ""}
                      </p>
                    </div>
                    <button
                      ref={(node) => {
                        if (node) {
                          removeButtonRefs.current.set(item.id, node);
                        } else {
                          removeButtonRefs.current.delete(item.id);
                        }
                      }}
                      type="button"
                      className={styles.removeButton}
                      aria-label={`Remove ${item.file.name}`}
                      disabled={disabled}
                      onClick={() => handleRemove(item)}
                    >
                      <X className={styles.removeIcon} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div
              id={statusId}
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className={styles.statusRegion}
            >
              {statusMessage}
            </div>
          </div>
        );
      }}
    </FormField>
  );
}
