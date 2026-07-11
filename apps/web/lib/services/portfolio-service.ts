import { apiClient } from "@/lib/api/client";

/**
 * SHARE-001 (web half): welper work-portfolio CRUD + the client-side
 * EXIF-strip upload pipeline.
 *
 * Upload contract (mirrors the dispute-evidence two-step pattern):
 *   1. Re-encode the picked image through a canvas (strips ALL metadata,
 *      including GPS — the BFF documents this as a client responsibility).
 *   2. `POST /api/profiles/me/portfolio/presign` with the re-encoded blob's
 *      type/size → short-lived S3 PUT URL.
 *   3. PUT the bytes directly to S3.
 *   4. `POST /api/profiles/me/portfolio` with the returned key → pending row.
 *
 * HEIC caveat: the BFF whitelist allows `image/heic`, but canvas decoding of
 * HEIC fails in most browsers, so the client accept-list intentionally
 * excludes it — users convert to JPG first. Once the re-encode exists we only
 * ever presign `image/jpeg` anyway.
 */

export type PortfolioPhotoStatus = "pending" | "approved" | "rejected";

export interface PortfolioPhoto {
  id: string;
  welperId: string;
  offeringId: string | null;
  s3Key: string;
  /** Resolved display URL; null when storage is unconfigured. */
  url: string | null;
  caption: string | null;
  sortOrder: number;
  status: PortfolioPhotoStatus;
  /** Set when status === "rejected". Surfaced honestly to the owner. */
  rejectionReason: string | null;
  createdAt: string;
}

interface PortfolioPresignResponse {
  uploadUrl: string;
  key: string;
  contentType: string;
  ttlSeconds: number;
}

/** Mirrors `PORTFOLIO_MAX_PHOTOS` on the BFF (24-photo cap → 409). */
export const PORTFOLIO_MAX_PHOTOS = 24;
/** Mirrors `PORTFOLIO_MAX_SIZE_BYTES` on the BFF (10 MB presign cap). */
export const PORTFOLIO_MAX_SIZE_BYTES = 10 * 1024 * 1024;
/** Caption cap — mirrors `UpdatePortfolioPhotoDto` / `CreatePortfolioPhotoDto`. */
export const PORTFOLIO_CAPTION_MAX_LENGTH = 200;

/**
 * Decodable-by-canvas formats only. HEIC is deliberately absent (see module
 * docblock) even though the BFF presign whitelist allows it.
 */
export const PORTFOLIO_ACCEPTED_INPUT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** `accept` attribute value for the file input. */
export const PORTFOLIO_FILE_INPUT_ACCEPT =
  PORTFOLIO_ACCEPTED_INPUT_TYPES.join(",");

const MAX_LONG_EDGE_PX = 2048;
const JPEG_QUALITY = 0.85;

const PORTFOLIO_BASE = "/api/profiles/me/portfolio";

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function listMyPortfolio(): Promise<PortfolioPhoto[]> {
  return apiClient.get<PortfolioPhoto[]>(PORTFOLIO_BASE);
}

export async function createPortfolioPhoto(input: {
  s3Key: string;
  caption?: string;
  offeringId?: string;
}): Promise<PortfolioPhoto> {
  return apiClient.post<PortfolioPhoto>(PORTFOLIO_BASE, input);
}

export async function updatePortfolioPhoto(
  photoId: string,
  input: { caption?: string; sortOrder?: number },
): Promise<PortfolioPhoto> {
  return apiClient.patch<PortfolioPhoto>(
    `${PORTFOLIO_BASE}/${encodeURIComponent(photoId)}`,
    input,
  );
}

export async function deletePortfolioPhoto(
  photoId: string,
): Promise<{ deleted: true }> {
  return apiClient.delete<{ deleted: true }>(
    `${PORTFOLIO_BASE}/${encodeURIComponent(photoId)}`,
  );
}

export async function reorderPortfolio(
  photoIds: string[],
): Promise<PortfolioPhoto[]> {
  return apiClient.patch<PortfolioPhoto[]>(`${PORTFOLIO_BASE}/reorder`, {
    photoIds,
  });
}

// ---------------------------------------------------------------------------
// EXIF-strip re-encode pipeline
// ---------------------------------------------------------------------------

/** Thrown when the browser cannot decode the picked file as an image. */
export class ImageDecodeError extends Error {
  constructor() {
    super("IMAGE_DECODE_FAILED");
    this.name = "ImageDecodeError";
  }
}

/** Thrown when the re-encoded JPEG still exceeds the 10 MB presign cap. */
export class ImageTooLargeError extends Error {
  constructor() {
    super("IMAGE_TOO_LARGE");
    this.name = "ImageTooLargeError";
  }
}

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

async function decodeViaImageElement(file: File): Promise<DecodedImage> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new ImageDecodeError());
      el.src = objectUrl;
    });
    // Browsers apply EXIF orientation to <img> by default (CSS
    // `image-orientation: from-image`), and drawImage uses the oriented
    // dimensions — so naturalWidth/Height are already display-correct.
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    throw err;
  }
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      // `imageOrientation: "from-image"` bakes the EXIF rotation into the
      // pixels so the flag can be safely discarded with the rest of the
      // metadata on re-encode.
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Fall through to the <img> path (older engines reject the options
      // bag or the format).
    }
  }
  return decodeViaImageElement(file);
}

/**
 * Re-encodes an image through a canvas: downscales to a 2048 px long edge and
 * exports as JPEG (quality 0.85). Canvas export writes pixels only — every
 * byte of container metadata (EXIF, GPS, IPTC, XMP) is dropped.
 */
export async function reencodeImageForUpload(file: File): Promise<Blob> {
  const decoded = await decodeImage(file);
  try {
    if (!decoded.width || !decoded.height) {
      throw new ImageDecodeError();
    }
    const scale = Math.min(
      1,
      MAX_LONG_EDGE_PX / Math.max(decoded.width, decoded.height),
    );
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new ImageDecodeError();
    }
    // Fill white first: JPEG has no alpha, and transparent PNG regions would
    // otherwise export as black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(decoded.source, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });
    if (!blob || blob.size === 0) {
      throw new ImageDecodeError();
    }
    if (blob.size > PORTFOLIO_MAX_SIZE_BYTES) {
      // Practically unreachable at 2048 px / q0.85, but the BFF cap is 10 MB
      // and we must fail honestly rather than let the presign 400.
      throw new ImageTooLargeError();
    }
    return blob;
  } finally {
    decoded.cleanup();
  }
}

// ---------------------------------------------------------------------------
// Upload orchestration
// ---------------------------------------------------------------------------

export type PortfolioUploadStage = "processing" | "uploading" | "saving";

/**
 * Full pipeline: re-encode → presign → S3 PUT → register. Resolves with the
 * created (pending-moderation) photo row.
 */
export async function uploadPortfolioPhoto(input: {
  file: File;
  caption?: string;
  offeringId?: string;
  onStage?: (stage: PortfolioUploadStage) => void;
}): Promise<PortfolioPhoto> {
  const { file, caption, offeringId, onStage } = input;

  onStage?.("processing");
  const blob = await reencodeImageForUpload(file);

  onStage?.("uploading");
  const presign = await apiClient.post<PortfolioPresignResponse>(
    `${PORTFOLIO_BASE}/presign`,
    { contentType: "image/jpeg", fileSize: blob.size },
  );

  const putRes = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": presign.contentType },
    body: blob,
  });
  if (!putRes.ok) {
    throw new Error(`UPLOAD_PUT_FAILED_${putRes.status}`);
  }

  onStage?.("saving");
  return createPortfolioPhoto({
    s3Key: presign.key,
    caption: caption?.trim() ? caption.trim() : undefined,
    offeringId: offeringId || undefined,
  });
}
