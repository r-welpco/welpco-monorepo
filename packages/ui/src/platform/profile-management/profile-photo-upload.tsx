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
import { Upload, X, Image as ImageIcon } from "lucide-react";

export interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string | null;
  currentPhotoAlt?: string;
  /** Replaces the default helper text under the heading. */
  description?: string;
  loading?: boolean;
  onUpload?: (file: File) => void | Promise<void>;
  onRemove?: () => void | Promise<void>;
  /** Cap card width (e.g. `640px`) to align with an adjacent profile form card. */
  maxWidth?: string;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  minDimensions?: { width: number; height: number };
  maxDimensions?: { width: number; height: number };
}

const DEFAULT_MAX_SIZE_MB = 5;
const DEFAULT_ACCEPTED_FORMATS = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const DEFAULT_MIN_DIMENSIONS = { width: 200, height: 200 };
const DEFAULT_MAX_DIMENSIONS = { width: 2000, height: 2000 };

export function ProfilePhotoUpload({
  currentPhotoUrl,
  currentPhotoAlt = "Profile photo",
  description = "Upload a clear photo of yourself. This helps customers recognize you.",
  loading,
  onUpload,
  onRemove,
  maxWidth,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
  minDimensions = DEFAULT_MIN_DIMENSIONS,
  maxDimensions = DEFAULT_MAX_DIMENSIONS,
}: ProfilePhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(null);
  }, [currentPhotoUrl]);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `File must be one of: ${acceptedFormats.join(", ")}`;
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `File size must be less than ${maxSizeMB}MB`;
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
            `Image must be at least ${minDimensions.width}x${minDimensions.height} pixels`
          );
        } else if (img.width > maxDimensions.width || img.height > maxDimensions.height) {
          resolve(
            `Image must be at most ${maxDimensions.width}x${maxDimensions.height} pixels`
          );
        } else {
          resolve(null);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve("Invalid image file");
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
          setError(err instanceof Error ? err.message : "We couldn't upload your photo. Try again, or pick a different file.");
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
        setError(err instanceof Error ? err.message : "Failed to remove photo");
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
            Profile photo
          </Heading>
          <Text size="2" color="gray" highContrast>
            {description}
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
              alt={currentPhotoAlt}
              fallback={currentPhotoAlt?.[0] || "U"}
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
                  {displayPhoto ? "Change photo" : "Upload photo"}
                </Flex>
              </Button>
            </Text>

            {displayPhoto && (
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
                  Remove photo
                </Flex>
              </Button>
            )}

            <Text size="1" color="gray" highContrast>
              Accepted: {acceptedFormats.map((f) => f.split("/")[1].toUpperCase()).join(", ")}.
              Max {maxSizeMB}MB. Min {minDimensions.width}x{minDimensions.height}px.
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
}

