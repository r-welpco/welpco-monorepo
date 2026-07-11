"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { Download } from "lucide-react";

/**
 * SHARE-004 — QR code with the Welpco logomark embedded center.
 *
 * Scan-contrast rules: modules are near-black on solid white (no brand
 * tinting), error-correction level **H** so the ~20% center chip stays well
 * inside the 30% recovery budget. The logomark sits on a white rounded chip
 * so it never touches modules directly.
 *
 * The on-screen preview draws at 512px (CSS-scaled down); Download composes
 * a fresh 1024px canvas → `welpco-{handle|id}-qr.png`.
 */

/** Near-black ink for modules — neutral, maximum scan contrast. */
const QR_DARK = "#14231A";
const QR_LIGHT = "#FFFFFF";
const LOGO_SRC = "/logos/Welpco_Isotype_Primary_Reg_128x128.svg";
/** Logomark ≈20% of the QR edge; the white chip adds breathing room around it. */
const LOGO_RATIO = 0.2;
const CHIP_RATIO = 0.28;

let logoImagePromise: Promise<HTMLImageElement> | null = null;

/**
 * Load the public logomark SVG as a drawable image. SVGs without explicit
 * width/height can fail `drawImage` in some browsers, so inject them.
 */
function loadLogoImage(): Promise<HTMLImageElement> {
  if (!logoImagePromise) {
    logoImagePromise = (async () => {
      const res = await fetch(LOGO_SRC);
      if (!res.ok) throw new Error("logo fetch failed");
      let svgText = await res.text();
      if (!/<svg[^>]*\swidth=/.test(svgText)) {
        svgText = svgText.replace(/<svg/, '<svg width="512" height="512"');
      }
      const blob = new Blob([svgText], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      try {
        return await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("logo decode failed"));
          img.src = url;
        });
      } finally {
        // The image keeps its decoded bitmap; the URL can go.
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
    })();
    logoImagePromise.catch(() => {
      logoImagePromise = null;
    });
  }
  return logoImagePromise;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** QR (level H) + centered logomark chip, composed onto `canvas` at `size` px. */
async function composeQr(
  canvas: HTMLCanvasElement,
  target: string,
  size: number,
): Promise<void> {
  await QRCode.toCanvas(canvas, target, {
    errorCorrectionLevel: "H",
    width: size,
    margin: 2,
    color: { dark: QR_DARK, light: QR_LIGHT },
  });

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  try {
    const logo = await loadLogoImage();
    const chipSize = Math.round(size * CHIP_RATIO);
    const logoSize = Math.round(size * LOGO_RATIO);
    const chipX = Math.round((size - chipSize) / 2);
    const chipY = Math.round((size - chipSize) / 2);
    const logoX = Math.round((size - logoSize) / 2);
    const logoY = Math.round((size - logoSize) / 2);

    ctx.fillStyle = QR_LIGHT;
    drawRoundedRect(ctx, chipX, chipY, chipSize, chipSize, Math.round(chipSize * 0.22));
    ctx.fill();
    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
  } catch {
    // Logomark unavailable — the plain QR is still fully functional.
  }
}

interface ShareQrCodeProps {
  /** Absolute QR target, already carrying `?src=qr`. */
  target: string;
  /** Filename slug: handle when claimed, welper id otherwise. */
  slug: string;
  downloadLabel: string;
  downloadingLabel: string;
  qrAriaLabel: string;
}

export function ShareQrCode({
  target,
  slug,
  downloadLabel,
  downloadingLabel,
  qrAriaLabel,
}: ShareQrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    void composeQr(canvas, target, 512);
  }, [target]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      await composeQr(canvas, target, 1024);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `welpco-${slug}-qr.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } finally {
      setDownloading(false);
    }
  }, [target, slug]);

  return (
    <Flex direction="column" align="start" gap="3">
      <Box
        style={{
          // White surround in both themes — the quiet zone is part of the code.
          backgroundColor: "#FFFFFF",
          borderRadius: "var(--radius-3)",
          border: "1px solid var(--gray-6)",
          padding: "8px",
          lineHeight: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={qrAriaLabel}
          style={{ width: "180px", height: "180px", display: "block" }}
        />
      </Box>
      <Button
        size="2"
        variant="soft"
        color={SEMANTIC_COLOR.primary}
        onClick={() => void handleDownload()}
        disabled={downloading}
      >
        <Download size={16} aria-hidden="true" />
        <Text as="span" size="2">
          {downloading ? downloadingLabel : downloadLabel}
        </Text>
      </Button>
    </Flex>
  );
}
