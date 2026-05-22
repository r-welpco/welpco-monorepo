"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Dialog, DialogContent } from "@welpco/ui/dialog";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Button } from "@welpco/ui/button";
import { Slider } from "@welpco/ui/slider";
import type { ProfilePhotoUploadLabels } from "./profile-photo-upload";

export interface ProfilePhotoCropDialogProps {
  open: boolean;
  imageSrc: string;
  labels: ProfilePhotoUploadLabels["crop"];
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (croppedAreaPixels: Area) => void | Promise<void>;
}

export function ProfilePhotoCropDialog({
  open,
  imageSrc,
  labels,
  loading,
  onOpenChange,
  onConfirm,
}: ProfilePhotoCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    await onConfirm(croppedAreaPixels);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!loading) onOpenChange(next);
      }}
    >
      <DialogContent
        title={labels.title}
        description={labels.description}
        maxWidth="480px"
        onPointerDownOutside={(e) => {
          if (loading) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (loading) e.preventDefault();
        }}
      >
        <Flex direction="column" gap="4">
          <Box
            position="relative"
            style={{
              width: "100%",
              height: 280,
              borderRadius: "var(--radius-3)",
              overflow: "hidden",
              backgroundColor: "var(--gray-3)",
            }}
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </Box>

          <Flex direction="column" gap="2">
            <Text size="2" weight="medium">
              {labels.zoom}
            </Text>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.05}
              onValueChange={([value]) => setZoom(value ?? 1)}
              disabled={loading}
            />
          </Flex>

          <Flex gap="3" justify="end" wrap="wrap">
            <Button
              type="button"
              variant="soft"
              color="gray"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              {labels.cancel}
            </Button>
            <Button
              type="button"
              disabled={loading || !croppedAreaPixels}
              onClick={() => void handleConfirm()}
            >
              {labels.save}
            </Button>
          </Flex>
        </Flex>
      </DialogContent>
    </Dialog>
  );
}
