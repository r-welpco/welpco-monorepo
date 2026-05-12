"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { IconButton } from "@welpco/ui/icon-button";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Separator } from "@welpco/ui/separator";
import { Callout } from "@welpco/ui/callout";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useCallback, useId, useState } from "react";
import { Paperclip, Upload, X } from "lucide-react";

/** Local row shape — what the picker shows. */
export interface EvidenceFile {
  id: string;
  name: string;
  size: number;
  type: string;
  /**
   * DISPUTES-001 (Day 16): when an `uploadFile` handler is supplied, the
   * component fills `key` after the S3 PUT succeeds. Until then the row
   * renders in `pending` state. `error` flips on for failed uploads.
   */
  key?: string;
  status?: "pending" | "uploading" | "uploaded" | "error";
  error?: string;
}

/**
 * DISPUTES-001 (Day 16): the BFF-shaped reference the dispute payload carries.
 * Mirrors `DisputeEvidenceItem` from `@welpco/types` without importing it
 * (this package keeps zero runtime dependencies on @welpco/types so the UI
 * package can ship to non-web consumers later).
 */
export interface EvidenceUploadItem {
  type: "file" | "message";
  key?: string;
  id?: string;
}

export interface EvidenceUploadProps {
  files?: EvidenceFile[];
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  /**
   * DISPUTES-001 (Day 16): when supplied, the component performs the S3
   * upload itself — calls the handler per accepted file, awaits the resulting
   * `key`, then surfaces the uploaded set via `onUploaded` (mapped to
   * `EvidenceUploadItem[]`). When omitted, the component preserves its
   * legacy "pure file picker" behaviour for callers that handle the upload
   * themselves.
   */
  uploadFile?: (file: File) => Promise<{ key: string }>;
  /**
   * DISPUTES-001 (Day 16): emitted whenever the set of successfully-uploaded
   * keys changes. The DisputeForm wires this directly into its onSubmit
   * payload.
   */
  onUploaded?: (items: EvidenceUploadItem[]) => void;
  onFilesChange?: (files: EvidenceFile[]) => void;
  onRemove?: (fileId: string) => void;
  /** Disable the picker (e.g. while the surrounding form is submitting). */
  disabled?: boolean;
}

const TRUNCATE_STYLE = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusLabel(file: EvidenceFile): string {
  switch (file.status) {
    case "uploading":
      return "Uploading…";
    case "error":
      return file.error ?? "Upload failed";
    case "uploaded":
      return "Attached";
    default:
      return formatFileSize(file.size);
  }
}

/**
 * Evidence file picker for disputes. Click the action button to open the
 * native file picker; selected files render as a list with size + remove
 * affordance. Errors surface in a semantic Callout. Bible §17.5 / §20.5
 * — disputes are trust-critical, errors and limits must be unambiguous.
 *
 * DISPUTES-001 (Day 16): when `uploadFile` is supplied, the component drives
 * the full upload lifecycle (per-file progress/error surfaces) and emits the
 * uploaded `{type: "file", key}[]` set via `onUploaded`. Failed uploads stay
 * in the list with an inline error and don't pollute the uploaded set.
 */
export function EvidenceUpload({
  files: externalFiles,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "application/pdf",
  ],
  uploadFile,
  onUploaded,
  onFilesChange,
  onRemove,
  disabled = false,
}: EvidenceUploadProps) {
  const inputId = useId();
  const [internalFiles, setInternalFiles] = useState<EvidenceFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isControlled = externalFiles !== undefined;
  const files = isControlled ? (externalFiles as EvidenceFile[]) : internalFiles;
  const isAtLimit = files.length >= maxFiles;

  const updateFiles = useCallback(
    (next: EvidenceFile[]) => {
      if (!isControlled) {
        setInternalFiles(next);
      }
      onFilesChange?.(next);
      if (onUploaded) {
        const items: EvidenceUploadItem[] = next
          .filter((f) => f.status === "uploaded" && typeof f.key === "string")
          .map((f) => ({ type: "file", key: f.key as string }));
        onUploaded(items);
      }
    },
    [isControlled, onFilesChange, onUploaded],
  );

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const target = event.currentTarget;
      const fileList = target.files;
      if (!fileList) return;

      const selectedFiles = Array.from(fileList);
      setError(null);

      if (files.length + selectedFiles.length > maxFiles) {
        setError(
          `You can attach up to ${maxFiles} files. Remove some to add more.`,
        );
        target.value = "";
        return;
      }

      const oversized = selectedFiles.find(
        (f) => f.size > maxSizeMB * 1024 * 1024,
      );
      if (oversized) {
        setError(
          `Each file must be smaller than ${maxSizeMB} MB. "${oversized.name}" is ${formatFileSize(oversized.size)}.`,
        );
        target.value = "";
        return;
      }

      // No-upload-handler path: legacy local-only behaviour.
      if (!uploadFile) {
        const newFiles: EvidenceFile[] = selectedFiles.map((file) => ({
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          status: "uploaded",
        }));
        updateFiles([...files, ...newFiles]);
        target.value = "";
        return;
      }

      // Upload-handler path: build pending rows immediately so the UI shows
      // progress, then resolve each in parallel.
      const initialRows: EvidenceFile[] = selectedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploading",
      }));
      let working: EvidenceFile[] = [...files, ...initialRows];
      updateFiles(working);
      target.value = "";

      await Promise.all(
        selectedFiles.map(async (file, idx) => {
          const rowId = initialRows[idx]!.id;
          try {
            const { key } = await uploadFile(file);
            working = working.map((row) =>
              row.id === rowId ? { ...row, status: "uploaded", key } : row,
            );
          } catch (e) {
            const message =
              e instanceof Error ? e.message : "Upload failed";
            working = working.map((row) =>
              row.id === rowId ? { ...row, status: "error", error: message } : row,
            );
          }
          updateFiles(working);
        }),
      );
    },
    [files, maxFiles, maxSizeMB, updateFiles, uploadFile],
  );

  const handleRemove = useCallback(
    (fileId: string) => {
      onRemove?.(fileId);
      const next = files.filter((f) => f.id !== fileId);
      updateFiles(next);
    },
    [files, onRemove, updateFiles],
  );

  return (
    <Card size="3" variant="surface" style={{ width: "100%" }}>
      <Flex direction="column" gap="3">
        <Box>
          <Heading size="4" mb="1" trim="start">
            Evidence (optional)
          </Heading>
          <Text size="2" color="gray" highContrast>
            Attach photos, screenshots, or PDFs that show what happened. Up to{" "}
            {maxFiles} files, {maxSizeMB} MB each. You can submit without
            attachments — we&rsquo;ll still review your report.
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <Box>
          <input
            type="file"
            multiple
            accept={acceptedTypes.join(",")}
            onChange={handleFileSelect}
            style={{ display: "none" }}
            id={inputId}
            disabled={disabled || isAtLimit}
          />
          <Text as="label" htmlFor={inputId}>
            <Button
              type="button"
              variant="outline"
              asChild
              disabled={disabled || isAtLimit}
            >
              <span>
                <Upload aria-hidden="true" size={16} />
                <Box ml="2" asChild>
                  <span>
                    {isAtLimit
                      ? `Limit reached (${files.length}/${maxFiles})`
                      : `Attach files (${files.length}/${maxFiles})`}
                  </span>
                </Box>
              </span>
            </Button>
          </Text>
        </Box>

        {files.length > 0 && (
          <>
            <Separator />
            <Flex direction="column" gap="2" asChild>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {files.map((file) => {
                  const isError = file.status === "error";
                  return (
                    <Box asChild key={file.id}>
                      <li>
                        <Flex
                          justify="between"
                          align="center"
                          p="2"
                          gap="2"
                          style={{
                            backgroundColor: isError
                              ? "var(--red-2)"
                              : "var(--gray-2)",
                            borderRadius: "var(--radius-2)",
                          }}
                        >
                          <Flex gap="2" align="center" style={{ flex: 1, minWidth: 0 }}>
                            <Paperclip
                              aria-hidden="true"
                              size={16}
                              style={{ color: "var(--gray-10)", flexShrink: 0 }}
                            />
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text
                                size="2"
                                weight="medium"
                                as="div"
                                style={TRUNCATE_STYLE}
                              >
                                {file.name}
                              </Text>
                              <Text
                                size="1"
                                color={isError ? SEMANTIC_COLOR.danger : "gray"}
                                highContrast={!isError}
                                as="div"
                              >
                                {statusLabel(file)}
                                {file.status === "uploaded"
                                  ? ` · ${formatFileSize(file.size)}`
                                  : null}
                              </Text>
                            </Box>
                          </Flex>
                          <IconButton
                            type="button"
                            variant="ghost"
                            color="gray"
                            size="1"
                            onClick={() => handleRemove(file.id)}
                            aria-label={`Remove ${file.name}`}
                            disabled={disabled}
                          >
                            <X aria-hidden="true" size={16} />
                          </IconButton>
                        </Flex>
                      </li>
                    </Box>
                  );
                })}
              </ul>
            </Flex>
          </>
        )}
      </Flex>
    </Card>
  );
}

EvidenceUpload.displayName = "EvidenceUpload";
