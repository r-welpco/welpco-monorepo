"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useState, useRef, useEffect, useCallback, useId } from "react";
import type { Area } from "react-easy-crop";
import { Upload, X } from "lucide-react";
import {
  cropProfilePhotoToFile,
  DEFAULT_JPEG_QUALITY,
  DEFAULT_OUTPUT_SIZE_PX,
} from "./crop-profile-photo";
import { ProfilePhotoCropDialog } from "./profile-photo-crop-dialog";
import { ProfilePhotoAvatar } from "./profile-photo-avatar";

export interface ProfilePhotoCropLabels {
  title: string;
  description: string;
  zoom: string;
  cancel: string;
  save: string;
}

export interface ProfilePhotoUploadLabels {
  title: string;
  description: string;
  photoAlt: string;
  uploadPhoto: string;
  changePhoto: string;
  removePhoto: string;
  acceptedHint: string;
  crop: ProfilePhotoCropLabels;
  errors: {
    invalidFormat: string;
    fileTooLarge: string;
    imageTooSmall: string;
    imageTooLarge: string;
    invalidImage: string;
    uploadFailed: string;
    removeFailed: string;
  };
}

const DEFAULT_PROFILE_PHOTO_UPLOAD_LABELS: ProfilePhotoUploadLabels = {
  title: "Profile photo",
  description:
    "Upload a clear photo of yourself. This helps customers recognize you.",
  photoAlt: "Profile photo",
  uploadPhoto: "Upload photo",
  changePhoto: "Change photo",
  removePhoto: "Remove photo",
  acceptedHint: "Accepted: {formats}. Max {maxSizeMB} MB. Min {minWidth}×{minHeight} px.",
  crop: {
    title: "Crop your photo",
    description: "Drag to reposition. Use the slider to zoom in or out.",
    zoom: "Zoom",
    cancel: "Cancel",
    save: "Save photo",
  },
  errors: {
    invalidFormat: "File must be one of: {formats}",
    fileTooLarge: "File size must be less than {maxSizeMB} MB",
    imageTooSmall: "Image must be at least {minWidth}×{minHeight} pixels",
    imageTooLarge: "Image must be at most {maxWidth}×{maxHeight} pixels",
    invalidImage: "Invalid image file",
    uploadFailed:
      "We couldn't upload your photo. Try again, or pick a different file.",
    removeFailed: "Failed to remove photo",
  },
};

function formatLabel(
  template: string,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

export interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string | null;
  currentPhotoAlt?: string;
  /** Replaces the default helper text under the heading. */
  description?: string;
  labels?: ProfilePhotoUploadLabels;
  loading?: boolean;
  onUpload?: (file: File) => void | Promise<void>;
  onRemove?: () => void | Promise<void>;
  /** Cap card width (e.g. `640px`) to align with an adjacent profile form card. */
  maxWidth?: string;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  minDimensions?: { width: number; height: number };
  maxDimensions?: { width: number; height: number };
  /** When true, shows a required marker and hides remove unless `onRemove` is provided. */
  required?: boolean;
  /** Square crop + JPEG compression before upload (default true). */
  enableCrop?: boolean;
  /** Output edge length in pixels after crop (default 1024). */
  outputSizePx?: number;
  /** JPEG quality 0–1 after crop (default 0.82). */
  outputQuality?: number;
}

const DEFAULT_MAX_SIZE_MB = 5;
const DEFAULT_ACCEPTED_FORMATS = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const DEFAULT_MIN_DIMENSIONS = { width: 200, height: 200 };
const DEFAULT_MAX_DIMENSIONS = { width: 2000, height: 2000 };

export function ProfilePhotoUpload({
  currentPhotoUrl,
  currentPhotoAlt,
  description,
  labels: labelsProp,
  loading,
  onUpload,
  onRemove,
  maxWidth,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
  minDimensions = DEFAULT_MIN_DIMENSIONS,
  maxDimensions = DEFAULT_MAX_DIMENSIONS,
  required = false,
  enableCrop = true,
  outputSizePx = DEFAULT_OUTPUT_SIZE_PX,
  outputQuality = DEFAULT_JPEG_QUALITY,
}: ProfilePhotoUploadProps) {
  const labels = labelsProp ?? DEFAULT_PROFILE_PHOTO_UPLOAD_LABELS;
  const photoAlt = currentPhotoAlt ?? labels.photoAlt;
  const helperText = description ?? labels.description;
  const inputId = useId();

  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearCropImageSrc = useCallback(() => {
    setCropImageSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  useEffect(() => {
    setPreview(null);
  }, [currentPhotoUrl]);

  useEffect(() => {
    return () => {
      if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    };
  }, [cropImageSrc]);

  const formatList = acceptedFormats
    .map((f) => f.split("/")[1]?.toUpperCase() ?? f)
    .join(", ");

  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return formatLabel(labels.errors.invalidFormat, { formats: formatList });
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return formatLabel(labels.errors.fileTooLarge, { maxSizeMB });
    }

    return null;
  };

  const validateImageDimensions = (
    file: File,
    options?: { skipMaxCheck?: boolean },
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        if (img.width < minDimensions.width || img.height < minDimensions.height) {
          resolve(
            formatLabel(labels.errors.imageTooSmall, {
              minWidth: minDimensions.width,
              minHeight: minDimensions.height,
            }),
          );
        } else if (
          !options?.skipMaxCheck &&
          (img.width > maxDimensions.width || img.height > maxDimensions.height)
        ) {
          resolve(
            formatLabel(labels.errors.imageTooLarge, {
              maxWidth: maxDimensions.width,
              maxHeight: maxDimensions.height,
            }),
          );
        } else {
          resolve(null);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(labels.errors.invalidImage);
      };

      img.src = objectUrl;
    });
  };

  const uploadProcessedFile = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    if (!onUpload) return;

    try {
      await onUpload(file);
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : labels.errors.uploadFailed);
      throw err;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploading) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setError(null);

    try {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const dimensionError = await validateImageDimensions(file, {
        skipMaxCheck: enableCrop,
      });
      if (dimensionError) {
        setError(dimensionError);
        return;
      }

      if (enableCrop) {
        clearCropImageSrc();
        setCropImageSrc(URL.createObjectURL(file));
        setCropDialogOpen(true);
        return;
      }

      setUploading(true);
      await uploadProcessedFile(file);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (!enableCrop) setUploading(false);
    }
  };

  const handleCropConfirm = async (croppedAreaPixels: Area) => {
    if (!cropImageSrc) return;

    setUploading(true);
    setError(null);

    try {
      const file = await cropProfilePhotoToFile(cropImageSrc, croppedAreaPixels, {
        outputSizePx,
        quality: outputQuality,
      });
      await uploadProcessedFile(file);
      setCropDialogOpen(false);
      clearCropImageSrc();
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.errors.uploadFailed);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCropDialogOpenChange = (open: boolean) => {
    if (uploading) return;
    setCropDialogOpen(open);
    if (!open) clearCropImageSrc();
  };

  const handleRemove = async () => {
    if (onRemove) {
      setUploading(true);
      try {
        await onRemove();
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : labels.errors.removeFailed);
      } finally {
        setUploading(false);
      }
    } else {
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const displayPhoto = preview || currentPhotoUrl;

  return (
    <Card
      size="3"
      variant="surface"
      style={{ width: "100%", minWidth: 0, ...(maxWidth ? { maxWidth } : {}) }}
    >
      <Flex direction="column" gap="3">
        <Box>
          <Heading size="4" mb="1">
            {labels.title}
            {required ? (
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                *
              </Text>
            ) : null}
          </Heading>
          <Text size="2" color="gray" highContrast>
            {helperText}
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <Flex
          gap="4"
          align="center"
          direction={{ initial: "column", sm: "row" }}
        >
          <Box>
            <ProfilePhotoAvatar
              src={displayPhoto}
              alt={photoAlt}
              fallback={photoAlt[0] || "U"}
            />
          </Box>

          <Flex direction="column" gap="2" style={{ flex: 1, width: "100%", minWidth: 0 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(",")}
              onChange={handleFileSelect}
              disabled={loading || uploading}
              style={{ display: "none" }}
              id={inputId}
            />
            <Text as="label" htmlFor={inputId}>
              <Button
                type="button"
                variant="outline"
                size="2"
                disabled={loading || uploading}
                onClick={() => fileInputRef.current?.click()}
                style={{ width: "100%" }}
              >
                <Flex align="center" gap="2">
                  <Upload aria-hidden="true" style={{ width: "16px", height: "16px" }} />
                  {displayPhoto ? labels.changePhoto : labels.uploadPhoto}
                </Flex>
              </Button>
            </Text>

            {displayPhoto && onRemove && (
              <Button
                type="button"
                variant="ghost"
                color={SEMANTIC_COLOR.danger}
                size="2"
                disabled={loading || uploading}
                onClick={handleRemove}
                style={{ width: "100%" }}
              >
                <Flex align="center" gap="2">
                  <X style={{ width: "16px", height: "16px" }} />
                  {labels.removePhoto}
                </Flex>
              </Button>
            )}

            <Text size="1" color="gray" highContrast>
              {formatLabel(labels.acceptedHint, {
                formats: formatList,
                maxSizeMB,
                minWidth: minDimensions.width,
                minHeight: minDimensions.height,
              })}
            </Text>
          </Flex>
        </Flex>
      </Flex>

      {enableCrop && cropImageSrc ? (
        <ProfilePhotoCropDialog
          open={cropDialogOpen}
          imageSrc={cropImageSrc}
          labels={labels.crop}
          loading={uploading}
          onOpenChange={handleCropDialogOpenChange}
          onConfirm={handleCropConfirm}
        />
      ) : null}
    </Card>
  );
}

