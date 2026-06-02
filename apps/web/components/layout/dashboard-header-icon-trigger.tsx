"use client";

import type { ComponentProps, ReactNode } from "react";
import { IconButton } from "@welpco/ui/icon-button";
import { Box } from "@welpco/ui/box";

/** Lucide size inside the 32×32 header action slot (profile avatar is size-2). */
export const DASHBOARD_HEADER_GLYPH_SIZE = 20;

type IconButtonProps = ComponentProps<typeof IconButton>;

/**
 * Header action trigger aligned with the profile menu: size-3 IconButton
 * wrapping a 32×32 inner slot (same footprint as Avatar size="2").
 */
export function DashboardHeaderIconTrigger({
  children,
  ...props
}: IconButtonProps & { children: ReactNode }) {
  return (
    <IconButton variant="ghost" size="3" {...props}>
      <Box
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {children}
      </Box>
    </IconButton>
  );
}
