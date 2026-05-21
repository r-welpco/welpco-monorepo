"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { Avatar } from "@welpco/ui/avatar";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useState, useRef, useEffect } from "react";
import { Upload, X } from "lucide-react";

export interface ProfilePhotoUploadLabels {
  title: string;
  description: string;
  photoAlt: string;
  uploadPhoto: string;
  changePhoto: string;
  removePhoto: string;
  acceptedHint: string;
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
}: ProfilePhotoUploadProps) {
  const labels = labelsProp ?? DEFAULT_PROFILE_PHOTO_UPLOAD_LABELS;
  const photoAlt = currentPhotoAlt ?? labels.photoAlt;
  const helperText = description ?? labels.description;

  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(null);
  }, [currentPhotoUrl]);

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

  const validateImageDimensions = (file: File): Promise<string | null> => {
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
        } else if (img.width > maxDimensions.width || img.height > maxDimensions.height) {
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Guard against re-entry: if a previous upload is still in flight, ignore
    // additional selections. Without this the preview from file 2 races with
    // the still-uploading file 1, and the saved photoUrl can disagree with
    // what the user sees on screen.
    if (uploading) {
      // Reset the input so the same file can be retried after the in-flight
      // upload finishes.
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Validate dimensions
      const dimensionError = await validateImageDimensions(file);
      if (dimensionError) {
        setError(dimensionError);
        return;
      }

      // Create preview AFTER validation passes — no point flashing a preview
      // for a file we're about to reject.
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      if (onUpload) {
        try {
          await onUpload(file);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : labels.errors.uploadFailed,
          );
        }
      }
    } finally {
      setUploading(false);
      // Reset the input so picking the same file again re-fires onChange.
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
              <Text as="span" color="red" ml="1">
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
            <Avatar
              src={displayPhoto || undefined}
              alt={photoAlt}
              fallback={photoAlt[0] || "U"}
              size="8"
              width="120px"
              height="120px"
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
              id="profile-photo-upload"
            />
            <Text as="label" htmlFor="profile-photo-upload">
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
    </Card>
  );
}

