import type { Area } from "react-easy-crop";

const DEFAULT_OUTPUT_SIZE_PX = 1024;
const DEFAULT_JPEG_QUALITY = 0.82;

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

/**
 * Draws the cropped region into a square canvas and exports a compressed JPEG `File`.
 */
export async function cropProfilePhotoToFile(
  imageSrc: string,
  pixelCrop: Area,
  options?: { outputSizePx?: number; quality?: number },
): Promise<File> {
  const outputSizePx = options?.outputSizePx ?? DEFAULT_OUTPUT_SIZE_PX;
  const quality = options?.quality ?? DEFAULT_JPEG_QUALITY;
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not supported in this browser.");
  }

  canvas.width = outputSizePx;
  canvas.height = outputSizePx;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSizePx,
    outputSizePx,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
  });

  if (!blob) {
    throw new Error("Failed to compress image.");
  }

  return new File([blob], "profile-photo.jpg", {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export { DEFAULT_OUTPUT_SIZE_PX, DEFAULT_JPEG_QUALITY };
