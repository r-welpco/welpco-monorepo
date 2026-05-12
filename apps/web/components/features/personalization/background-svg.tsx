"use client";

import { Box } from "@welpco/ui/box";
import { getBackgroundById } from "@/lib/personalization/backgrounds";
import { getShapeById } from "@/lib/personalization/shapes";

interface BackgroundSVGProps {
  backgroundId: string;
  shapeId: string;
}

export function BackgroundSVG({ backgroundId, shapeId }: BackgroundSVGProps) {
  const background = getBackgroundById(backgroundId);
  const shape = getShapeById(shapeId);
  const uniqueId = backgroundId.replace(/-/g, "_");
  const shapeUniqueId = shapeId.replace(/-/g, "_");

  return (
    <Box
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: 1,
        ...Object.fromEntries(
          Object.entries(background.cssVariables).map(([key, value]) => [key, value])
        ),
      } as React.CSSProperties}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 2560 1920"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      >
        <defs>
          {/* Shape gradients - using background color variables */}
        </defs>
        
        {/* Shape paths - these replace the background */}
        <g>
          {shape.paths.map((pathDef, index) => {
            // Use background color variables for shapes
            // If stroke is already defined in pathDef, use it; otherwise use a color variable
            const colorVar = pathDef.stroke || `var(--color-background-image-accent-${(index % 7) + 1})`;
            
            return (
              <path
                key={index}
                d={pathDef.d}
                fill={pathDef.fill || undefined}
                stroke={pathDef.stroke || (!pathDef.fill ? colorVar : undefined)}
                strokeWidth={pathDef.strokeWidth || (!pathDef.fill ? "2" : undefined)}
                opacity={pathDef.opacity ?? 0.5}
                transform={pathDef.transform}
              />
            );
          })}
        </g>
      </svg>
    </Box>
  );
}

