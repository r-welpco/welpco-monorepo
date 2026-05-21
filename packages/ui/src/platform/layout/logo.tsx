"use client";

import { Flex } from "@welpco/ui/flex";

export interface LogoProps {
  variant?: "primary" | "white";
  type?: "isotype" | "logotype" | "imagotype";
  size?: number;
  /** Resolved UI scheme; used with `type="imagotype"` (light = green mark, dark = cream mark). */
  colorScheme?: "light" | "dark";
  className?: string;
}

const LOGOTYPE_ASPECT_RATIO = 2.5; // 250:100 from SVG viewBox
const IMAGOTYPE_LIGHT = "/logos/Welpco_Imagotype_Primary_Reg.svg";
const IMAGOTYPE_DARK = "/logos/Welpco_Imagotype_Primary_Reg_1.svg";

export function Logo({
  variant = "primary",
  type = "isotype",
  size = 32,
  colorScheme = "light",
  className,
}: LogoProps) {
  const src =
    type === "imagotype"
      ? colorScheme === "dark"
        ? IMAGOTYPE_DARK
        : IMAGOTYPE_LIGHT
      : type === "isotype"
        ? variant === "white"
          ? "/logos/Welpco_Isotype_White_Reg_32x32.svg"
          : "/logos/Welpco_Isotype_Primary_Reg_32x32.svg"
        : variant === "white"
          ? "/logos/Welpco_Logotype_White_Reg.svg"
          : "/logos/Welpco_Logotype_Primary_Reg.svg";

  const width =
    type === "isotype" ? size : Math.round(size * LOGOTYPE_ASPECT_RATIO);
  const height = size;

  return (
    <Flex
      align="center"
      justify="center"
      className={className}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <img
        src={src}
        alt="Welpco"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </Flex>
  );
}

Logo.displayName = "Logo";
